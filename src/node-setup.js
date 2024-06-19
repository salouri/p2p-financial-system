// node-setup.js
import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';
import readline from 'readline';
import {bootstrapNodes, commonTopic, generateKeyPair} from './common/config.js';
import handleTermination from './common/utils/handleTermination.js';
import {initializeDb} from './common/utils/initializeDb.js';
import requestHandlers from './peer/peerRequestHandler.js';
import respondHandlers from './server/serverRespondHandler.js';
import registerPeerEvents from './peer/registerPeerEvents.js';
import registerSocketEvents from './server/registerSocketEvents.js';
import retrieveKnownPeers from './common/utils/retrieveKnownPeers.js';

const connectedPeers = new Set();

export async function startNode(storageDir) {
  const swarm = new Hyperswarm();
  const {knownPeers, knownPeersDb} = await retrieveKnownPeers(
    storageDir,
    generateKeyPair(),
  );

  const keyPair = generateKeyPair();
  const dht = new DHT({keyPair, bootstrap: bootstrapNodes});
  await dht.ready();

  const {core, db} = await initializeDb({storageDir}); // uses shared keyPair
  const rpc = new RPC({dht, keyPair});

  const server = rpc.createServer();
  await server.listen();
  const serverPublicKey = server.publicKey.toString('hex');
  console.log('Node Public Key:', serverPublicKey);

  // Handle RPC server events
  server.on('listening', () => {
    console.log('Server is listening...');
  });

  server.on('close', () => {
    console.log('Server is closed');
    // notify all connected peers and close all connections
    for (const peer of connectedPeers) {
      peer.write(
        Buffer.from(JSON.stringify({message: 'Server is shutting down.'})),
      );
      peer.destroy();
    }
    swarm.destroy();
    console.log('All connections closed and swarm destroyed.');
    process.exit();
  });

  server.on('connection', async rpcClient => {
    console.log('Server got a new connection');
    connectedPeers.add(rpcClient);
    console.log('Connected RPC clients:', connectedPeers.size);
    // get the peer's public key
    const remotePublicKey = rpcClient.publicKey.toString('hex');
    await knownPeersDb.put(remotePublicKey, {timestamp: Date.now()});

    // Handle RPC client events
    rpcClient.on('close', () => {
      connectedPeers.delete(rpcClient);
      console.log('Connection closed, total connections:', connectedPeers.size);
    });

    rpcClient.on('destroy', () => {
      console.log('RPC connection destroyed');
    });
  });

  // Define Server Responses
  server.respond('sendPublicKey', () =>
    respondHandlers.sendPublicKeyRespond(serverPublicKey),
  );
  server.respond('sendTransaction', async req =>
    respondHandlers.sendTransactionRespond(req, core, db),
  );
  server.respond(
    'getTransaction',
    async req => await respondHandlers.getTransactionRespond(req, core),
  );

  // Handle Swarm events
  swarm.on('connection', (socket, info) => {
    console.log('Swarm: got a new connection.');

    socket.write(Buffer.from(JSON.stringify({serverPublicKey})));

    registerSocketEvents(socket);

    const rpcPeer = rpc.connect(socket.publicKey);
    registerPeerEvents(rpcPeer, connectedPeers);

    socket.on('data', async serverData => {
      console.log(
        'Received data from a remote peer (server):',
        JSON.stringify(JSON.parse(serverData.toString()), null, 2),
      );
      const {serverPublicKey} = JSON.parse(serverData.toString());
      if (serverPublicKey) {
        const client = rpc.connect(Buffer.from(serverPublicKey, 'hex'));
        registerPeerEvents(client, connectedPeers);

        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        rl.on('line', async input => {
          const [command, ...jsonData] = input.split(' ');
          try {
            const data = JSON.parse(jsonData?.join(' ') || '{}');

            if (command === 'send') {
              const {sender, receiver, amount} = data;
              await requestHandlers.sendTransactionRequest(
                client,
                {sender, receiver, amount},
                core,
                db,
              );
            } else if (command === 'get') {
              const {index} = data;
              await requestHandlers.getTransactionRequest(client, index);
            } else if (command === 'sendPublicKey') {
              await requestHandlers.sendPublicKeyRequest(client);
            } else {
              console.error('Invalid command');
            }
          } catch (error) {
            console.error('Error processing command:', error);
          }
        });
      }
    });
  });

  const discovery = swarm.join(commonTopic, {server: true, client: true});
  await discovery.flushed(); // once resolved, it means topic is joined

  // Connect to known peers
  for (const {publicKey} of knownPeers) {
    try {
      const peerKeyBuffer = Buffer.from(publicKey, 'hex');
      const peerRpc = rpc.connect(peerKeyBuffer);
      registerPeerEvents(peerRpc, connectedPeers);
    } catch (error) {
      console.error(
        `Failed to connect to known peer with publicKey ${publicKey}:`,
        error,
      );
    }
  }

  console.log('Node is running');

  handleTermination(swarm, core, db);
}
