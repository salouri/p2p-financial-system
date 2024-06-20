// node-setup.js
import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';
import readline from 'readline';
import {
  bootstrapNodes,
  commonTopic,
  generateKeyPair,
} from './common/config/index.js';
import handleExit from './common/utils/handleExit.js';
import initializeDb from './common/utils/initializeDb.js';
import requestHandlers from './peer/peerRequestHandler.js';
import registerPeerEvents from './peer/registerPeerEvents.js';
import registerSocketEvents from './server/registerSocketEvents.js';
import getAllPeers from './common/utils/getAllPeers.js';
import defineServerResponds from './server/defineServerResponds.js';

const connectedPeers = {
  bidders: new Map(),
  sellers: new Map(),
};

export async function startNode(storageDir, knownPeers = null) {
  const swarm = new Hyperswarm();

  const keyPair = generateKeyPair();
  const dht = new DHT({keyPair, bootstrap: bootstrapNodes});
  await dht.ready();

  const {core, db} = await initializeDb({storageDir}); // uses shared keyPair
  const rpc = new RPC({dht});

  const server = rpc.createServer();
  await server.listen();
  console.log('Server is listening...');

  const serverPublicKey = server.publicKey.toString('hex');
  console.log('Node Public Key:', serverPublicKey);

  // Handle RPC server events
  server.on('close', () => {
    console.log('Server is closed');
    // Notify all connected peers and close all connections
    const allPeers = getAllPeers(connectedPeers);
    requestHandlers.notifyPeersRequest(allPeers, 'Server is shutting down.');
    for (const {client} of allPeers) {
      client.destroy();
    }
    swarm.destroy();
    console.log('All connections closed and swarm destroyed.');
    process.exit();
  });

  // When other nodes (as bidders) connecting to this current one (seller)
  server.on('connection', async rpcClient => {
    console.log('Server received a new connection');
    registerPeerEvents(rpcClient, connectedPeers, 'bidders');
  });

  defineServerResponds(server, core, db, connectedPeers);

  // Handle Swarm events
  swarm.on('connection', (socket, details) => {
    console.log('Swarm: New connection established');

    socket.write(Buffer.from(JSON.stringify({serverPublicKey})));

    registerSocketEvents(socket);

    socket.on('data', async remoteData => {
      console.log(
        'Received data from a peer:',
        JSON.parse(remoteData.toString()),
      );
      const {serverPublicKey} = JSON.parse(remoteData.toString());

      if (serverPublicKey) {
        // When this node (as a bidder) connecting to other nodes (sellers)
        let client;
        try {
          client = rpc.connect(Buffer.from(serverPublicKey, 'hex'));
          registerPeerEvents(client, connectedPeers, 'sellers');
          console.log(
            `Node connected to ${serverPublicKey.substring(0, 15)}...`,
          );
        } catch (error) {
          console.error(error);
          throw new Error('Error trying to connect to client!');
        }

        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        rl.on('line', async input => {
          const [command, ...jsonData] = input.split(' ');
          try {
            let data = {};
            if (jsonData.length > 0) {
              const dataStr = jsonData.join(' ');
              data = JSON.parse(
                dataStr
                  .replace(/([a-zA-Z0-9_]+?):/g, '"$1":')
                  .replace(/'/g, '"'),
              );
            }
            switch (command) {
              case 'sendPublicKey':
                await requestHandlers.sendPublicKeyRequest(client);
                break;

              case 'notifyPeers':
                const allPeers = getAllPeers(connectedPeers);
                const message =
                  data?.message || 'Broadcast message to all peers';
                await requestHandlers.notifyPeersRequest(allPeers, message);
                console.log(`Peers notified with message: "${message}"`);
                break;

              case 'createAuction':
                const {sellerId, item} = data;
                const auctionResponse =
                  await requestHandlers.createAuctionRequest(
                    client,
                    sellerId,
                    item,
                  );
                console.log('Auction Created:', auctionResponse);
                break;

              case 'placeBid':
                const {auctionId, bidderId, amount} = data;
                const bidResponse = await requestHandlers.placeBidRequest(
                  client,
                  auctionId,
                  bidderId,
                  parseFloat(amount),
                );
                console.log('Bid Placed:', bidResponse);
                break;

              case 'closeAuction':
                const {auctionId: auctionToCloseId} = data;
                const closeAuctionResponse =
                  await requestHandlers.closeAuctionRequest(
                    client,
                    auctionToCloseId,
                  );
                console.log('Auction Closed:', closeAuctionResponse);
                break;

              default:
                console.log('Unknown command');
            }
          } catch (error) {
            console.error('Error processing command:', error);
          }
        });
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
  const allPeers = getAllPeers(connectedPeers);
  handleExit({swarm, core, db, storageDir, allPeers});
}
