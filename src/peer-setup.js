import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';
import {COMMON_TOPIC} from './config.js';
import {registerRpcEvents} from './utils.js';

export async function startPeer(storageDir, initialServerPublicKey) {
  const swarm = new Hyperswarm();
  console.log('Hyperswarm instance created');

  const dht = new DHT();
  const rpc = new RPC({dht});

  let publicKeyBuffer;
  if (initialServerPublicKey) {
    publicKeyBuffer = Buffer.from(initialServerPublicKey, 'hex');
    const specificDiscovery = swarm.join(publicKeyBuffer, {client: true});
    await specificDiscovery.flushed();
  } else {
    const commonDiscovery = swarm.join(COMMON_TOPIC, {client: true});
    await commonDiscovery.flushed();
    publicKeyBuffer = rpc.defaultKeyPair.publicKey;
  }
  console.log('>> publicKeyBuffer: ', publicKeyBuffer);

  const client = rpc.connect(publicKeyBuffer);

  swarm.on('connection', (socket, peerInfo) => {
    console.log('Peer connected to the server');
    registerRpcEvents(client);

    client.on('open', async () => {
      console.log('Client RPC connection opened');

      if (!initialServerPublicKey) {
        try {
          const {publicKey} = await client.request('sendPublicKey', {});
          publicKeyBuffer = Buffer.from(publicKey, 'hex');
          console.log(
            'Received server public key:',
            publicKeyBuffer.toString('hex'),
          );
        } catch (error) {
          console.error('Error receiving server public key:', error);
        }
      }

      const sendArgs = {sender: 'Alice', receiver: 'Bob', amount: 100};
      try {
        const sendResponse = await client.request('sendTransaction', [
          sendArgs,
        ]);
        console.log('Transaction sent:', sendResponse);
      } catch (error) {
        console.error('Error sending transaction:', error);
      }

      try {
        const getResponse = await client.request('getTransaction', [
          {index: 0},
        ]);
        console.log('Transaction received:', getResponse);
      } catch (error) {
        console.error('Error getting transaction:', error);
      }
    });
  });

  await swarm.flush();
  console.log('Client is ready and looking for servers');

  console.log('Peer is running...');
}
