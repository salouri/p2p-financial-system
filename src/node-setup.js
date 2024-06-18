// node-setup.js
import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';
import readline from 'readline';
import {bootstrapNodes, commonTopic, generateKeyPair} from './common/config.js';
import handleTermination from './common/utils/handleTermination.js';
import {
  getTransactionRequest,
  sendPublicKeyRequest,
  sendTransactionRequest,
} from './peer/peerRequestHandler.js';
import registerPeerEvents from './peer/registerPeerEvents.js';
import {
  getTransactionRespond,
  sendPublicKeyRespond,
  sendTransactionRespond,
} from './server/serverRespondHandler.js';
import createCoreAndBee from './server/utils/createCoreAndBee.js';
import registerSocketEvents from './server/utils/registerSocketEvents.js';

const connectedPeers = new Set();

export async function startNode(storageDir) {
  const swarm = new Hyperswarm();
  const keyPair = generateKeyPair();
  const dht = new DHT({keyPair, bootstrap: bootstrapNodes});
  await dht.ready();

  const {core, db} = await createCoreAndBee(storageDir, 'json');
  const rpc = new RPC({dht, keyPair});

  const server = rpc.createServer();
  await server.listen();
  const serverPublicKey = server.publicKey.toString('hex');
  console.log('Node Public Key:', serverPublicKey);

  const connectedPeers = new Set();

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

  server.on('connection', rpcClient => {
    console.log('Server got a new connection');
    connectedPeers.add(rpcClient);
    console.log('Connected RPC clients:', connectedPeers.size);

    rpcClient.on('close', () => {
      connectedPeers.delete(rpcClient);
      console.log('Connection closed, total connections:', connectedPeers.size);
    });

    rpcClient.on('destroy', () => {
      console.log('RPC connection destroyed');
    });
  });

  // Define Server Responses
  server.respond('sendPublicKey', () => sendPublicKeyRespond(serverPublicKey));
  server.respond('sendTransaction', async req =>
    sendTransactionRespond(req, core, db),
  );
  server.respond(
    'getTransaction',
    async req => await getTransactionRespond(req, core),
  );

  // Handle Swarm events
  swarm.on('connection', (socket, info) => {
    console.log('Swarm: got a new connection.');

    socket.write(Buffer.from(JSON.stringify({serverPublicKey})));

    registerSocketEvents(socket);

    const rpcPeer = rpc.connect(socket.publicKey);
    rpcPeer.on('open', () => console.log('Peer  connection opened'));
    rpcPeer.on('close', () => console.log('Peer  connection closed'));
    rpcPeer.on('destroy', () => console.log('Peer  connection destroyed'));

    socket.on('data', async serverData => {
      console.log(
        'Received data from a remote peer (server):',
        JSON.stringify(JSON.parse(serverData.toString()), null, 2),
      );
      const {serverPublicKey} = JSON.parse(serverData.toString());
      if (serverPublicKey) {
        const client = rpc.connect(Buffer.from(serverPublicKey, 'hex'));
        registerPeerEvents(client);

        // Read from stdin
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
              await sendTransactionRequest(
                client,
                {
                  sender,
                  receiver,
                  amount,
                },
                core,
                db,
              );
            } else if (command === 'get') {
              const {index} = data;
              await getTransactionRequest(client, index);
            } else if (command === 'sendPublicKey') {
              await sendPublicKeyRequest(client);
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
  console.log('Node is running');

  handleTermination(swarm, core, db);
}
