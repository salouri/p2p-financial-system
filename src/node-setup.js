// node-setup.js
import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';
import readline from 'readline';
import {
  bootstrapNodes,
  commonTopic,
  generateKeyPair,
} from './common/config/config.js';
import handleExit from './common/utils/handleExitjs';
import {initializeDb} from './common/utils/initializeDb.js';
import requestHandlers from './peer/peerRequestHandler.js';
import respondHandlers from './server/serverRespondHandler.js';
import registerPeerEvents from './peer/registerPeerEvents.js';
import registerSocketEvents from './server/registerSocketEvents.js';

const connectedPeers = {
  senders: new Map(),
  receivers: new Map(),
};

export async function startNode(storageDir, knownPeers = null) {
  const swarm = new Hyperswarm();

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
  // when other nodes (as senders) connecting to this current one (receiver)
  server.on('connection', async rpcClient => {
    console.log('Server received a new connection');
    registerPeerEvents(rpcClient, connectedPeers, 'senders');
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
  server.respond(
    'notifyPeers',
    async req => await respondHandlers.notifyPeersRespond(req),
  );

  // Handle Swarm events
  swarm.on('connection', (socket, info) => {
    console.log('Swarm: got a new connection.');

    socket.write(Buffer.from(JSON.stringify({serverPublicKey})));

    registerSocketEvents(socket);

    socket.on('data', async serverData => {
      console.log(
        'Received data from peer:',
        JSON.parse(serverData.toString()),
      );
      const {serverPublicKey} = JSON.parse(serverData.toString());
      if (serverPublicKey) {
        // when this node (as a sender) connecting to other nodes (receivers)
        const client = rpc.connect(Buffer.from(serverPublicKey, 'hex'));
        registerPeerEvents(client, connectedPeers, 'receivers');

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
              const data = JSON.parse(
                dataStr
                  .replace(/([a-zA-Z0-9_]+?):/g, '"$1":')
                  .replace(/'/g, '"'),
              );
            }

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
            } else if (command === 'notifyPeers') {
              const allPeers = getAllPeers(connectedPeers);
              const message = data?.message || 'Broadcast message to all peers';
              requestHandlers.notifyPeersRequest(allPeers, message);
              console.log(`Broadcasted to connected peers: "${message}"`);
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
  if (knownPeers) {
    const receiverPeers = knownPeers?.receivers;

    for (const peer of receiverPeers) {
      const {publicKey} = peer;
      const peerKeyBuffer = Buffer.from(publicKey, 'hex');
      try {
        const peerKeyBuffer = Buffer.from(publicKey, 'hex');
        const peerRpc = rpc.connect(peerKeyBuffer);
        registerPeerEvents(peerRpc, connectedPeers, 'receivers');
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

function getAllPeers(connectedPeers) {
  const allPeers = new Set();

  for (const peer of connectedPeers['senders'].values()) {
    allPeers.add(peer);
  }

  for (const peer of connectedPeers['receivers'].values()) {
    allPeers.add(peer);
  }

  return Array.from(allPeers);
}
