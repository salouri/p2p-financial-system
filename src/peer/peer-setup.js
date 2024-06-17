import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';
import {bootstrapNodes, commonTopic} from '../common/config.js';
import handleTermination from '../common/utils/handleTermination.js';
import registerPeerEvents from './registerPeerEvents.js';

export async function startPeer(storageDir, initialServerPublicKey) {
  const swarm = new Hyperswarm();

  const dht = new DHT({port: 50001, bootstrap: bootstrapNodes});
  await dht.ready();

  const rpc = new RPC({dht}); // can take {dht, keyPair}

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

        // send transaction requestion
        let transIndex = null;
        try {
          const sendArgs = {sender: 'Alice', receiver: 'Bob', amount: 100};
          const sendRes = await client.request(
            'sendTransaction',
            Buffer.from(JSON.stringify(sendArgs)),
          );
          console.log('Transaction sent:', JSON.parse(sendRes.toString()));
          transIndex = JSON.parse(sendRes.toString()).index;
        } catch (error) {
          console.error('Error sending transaction:', error);
        }

        if (transIndex != null) {
          try {
            const getResponse = await client.request(
              'getTransaction',
              Buffer.from(JSON.stringify({index: transIndex})),
            );
            console.log(
              'Transaction received:',
              JSON.parse(getResponse.toString()),
            );
          } catch (error) {
            console.error('Error getting transaction:', error);
          }
        }
      }
    });
  });

  const discovery = swarm.join(commonTopic, {server: false, client: true});
  await discovery.flushed(); // Waits for the swarm to connect to pending peers.

  console.log('Peer is running');

  handleTermination(swarm);
}
