import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';
import readline from 'readline';
import {bootstrapNodes, commonTopic} from '../common/config.js';
import handleTermination from '../common/utils/handleTermination.js';
import peerRequestHandler from './peerRequestHandler.js';
import registerPeerEvents from './registerPeerEvents.js';

export async function startPeer(storageDir, initialServerPublicKey) {
  const swarm = new Hyperswarm();

  const dht = new DHT({port: 50001, bootstrap: bootstrapNodes});
  await dht.ready();

  const rpc = new RPC({dht});

  swarm.on('connection', async (connection, peerInfo) => {
    console.log('>>>> swarm: got a new connection.');

    console.log('remotePublicKey:', connection.remotePublicKey.toString('hex'));
    console.log('publicKey:', connection.publicKey.toString('hex'));

    connection.on('error', err => {
      console.error('RPC Connection error:', err);
    });

    connection.on('data', async data => {
      console.log('Received data from peer:', data.toString());
      const {serverPublicKey} = JSON.parse(data.toString());
      console.log('serverPublicKey:', serverPublicKey);

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
              await peerRequestHandler.sendTransaction(client, {
                sender,
                receiver,
                amount,
              });
            } else if (command === 'get') {
              const {index} = data;
              await peerRequestHandler.getTransaction(client, index);
            } else if (command === 'sendPublicKey') {
              await peerRequestHandler.sendPublicKey(client);
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

  const discovery = swarm.join(commonTopic, {server: false, client: true});
  await discovery.flushed();

  console.log('Peer is running');
  handleTermination(swarm);
}
