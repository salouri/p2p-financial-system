import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';
import readline from 'readline';
import {
  bootstrapNodes,
  commonTopic,
  generateKeyPair,
} from './common/config/index.js';
import handleShutdown from './common/utils/handleShutdown.js';
import initializeDb from './common/utils/initializeDb.js';
import requestHandlers from './peer/peerRequestHandler.js';
import registerPeerEvents from './peer/registerPeerEvents.js';
import registerSocketEvents from './server/registerSocketEvents.js';
import getAllPeers from './peer/getAllPeers.js';
import defineServerResponds from './server/defineServerResponds.js';
import {
  defineServerEndpoints,
  defineLocalEndpoints,
} from './server/defineEndpoints.js';
import {
  getActiveAuctionsFromDb,
  getCachedActiveAuctions,
} from './auction/auctionManager.js';

const connectedPeers = {
  bidders: new Map(),
  sellers: new Map(),
};

export async function startNode(storageDir, knownPeers = null) {
  const swarm = new Hyperswarm();

  const keyPair = generateKeyPair();
  const dht = new DHT({keyPair, bootstrap: bootstrapNodes});
  await dht.ready();

  const db = await initializeDb(storageDir); // uses shared keyPair
  await getActiveAuctionsFromDb(db); // Populate activeAuctions cache at startup

  const rpc = new RPC({dht});

  const server = rpc.createServer();
  await server.listen();
  console.log('Server is listening...');

  const serverPublicKey = server.publicKey.toString('hex');
  console.log('Node Public Key:', serverPublicKey);

  // Local commands that don't require a client connection
  const rLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  await defineLocalEndpoints(rLine, db, connectedPeers);

  // Handle RPC server events
  server.on('close', async () => {
    console.log('Server is closed');
    // Notify all connected peers and close all connections
    const allPeers = getAllPeers(connectedPeers);
    requestHandlers.notifyPeersRequest(allPeers, 'Server is shutting down.');
    for (const {client} of allPeers) {
      client.destroy();
    }
    await swarm.destroy();
    console.log('All connections closed and swarm destroyed.');
    await db.close(); // Ensure the database is closed properly
    console.log('Database closed.');
    process.exit();
  });

  // When other nodes (as bidders) connect to this current one (seller)
  server.on('connection', async rpcClient => {
    console.log('Server received a new connection');
    registerPeerEvents(rpcClient, connectedPeers, 'bidders');
    // Notify new peer about existing auctions using cached active auctions
    const activeAuctions = getCachedActiveAuctions();
    requestHandlers.notifyOnePeerRequest(rpcClient, {auctions: activeAuctions});
  });

  await defineServerResponds(server, db, connectedPeers);

  swarm.on('connection', (socket, details) => {
    console.log('Swarm: Socket connection established');

    socket.write(Buffer.from(JSON.stringify({serverPublicKey})));

    registerSocketEvents(socket);

    socket.on('data', async remoteData => {
      console.log(
        'Received data from a peer:',
        JSON.parse(remoteData.toString()),
      );
      const {serverPublicKey} = JSON.parse(remoteData.toString());

      if (serverPublicKey) {
        const client = rpc.connect(Buffer.from(serverPublicKey, 'hex'));
        registerPeerEvents(client, connectedPeers, 'sellers');

        // Define server endpoints for clients/remote communication
        await defineServerEndpoints(rLine, client, db, connectedPeers);
      }
    });
  });

  const discovery = swarm.join(commonTopic, {server: true, client: true});
  await discovery.flushed(); // Once resolved, it means the topic is joined

  // Connect to known peers
  if (knownPeers) {
    const sellerPeers = knownPeers?.sellers;

    for (const peer of sellerPeers) {
      const {publicKey} = peer;
      const peerKeyBuffer = Buffer.from(publicKey, 'hex');
      try {
        const peerRpc = rpc.connect(peerKeyBuffer);
        registerPeerEvents(peerRpc, connectedPeers, 'sellers');
      } catch (error) {
        console.error(
          `Failed to connect to known peer with publicKey ${publicKey}:`,
          error,
        );
      }
    }
  }

  console.log('Node is running');
  handleShutdown({swarm, db, storageDir, connectedPeers});
}
