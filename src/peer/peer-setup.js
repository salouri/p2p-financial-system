import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import {BOOTSTRAP_NODES, COMMON_TOPIC} from '../common/config.js';

export async function startPeer(storageDir, initialServerPublicKey) {
  const dht = new DHT({bootstrap: BOOTSTRAP_NODES});
  const rpc = new RPC({dht});

  let publicKeyBuffer;
  if (initialServerPublicKey) {
    publicKeyBuffer = Buffer.from(initialServerPublicKey, 'hex');
  } else {
    publicKeyBuffer = Buffer.alloc(32).fill(COMMON_TOPIC);
  }

  const client = rpc.connect(publicKeyBuffer);

  client.on('open', async () => {
    console.log('Client RPC connection opened');

    if (!initialServerPublicKey) {
      console.log('Requesting Server-Public-Key...');
      try {
        const {publicKey} = await client.request(
          'sendPublicKey',
          Buffer.alloc(0),
        );
        publicKeyBuffer = Buffer.from(publicKey, 'hex');
        console.log(
          'Received server public key:',
          publicKeyBuffer.toString('hex'),
        );
      } catch (error) {
        console.error('Error receiving server public key:', error);
      }
    }

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
  });

  const topic = Buffer.alloc(32).fill(COMMON_TOPIC);
  const discovery = dht.lookup(topic);

  discovery.on('peer', peer => {
    console.log('Peer found:', peer);
    client.connect(peer.publicKey);
  });

  discovery.on('error', err => {
    console.error('Discovery error:', err);
  });

  console.log('Client is ready and looking for servers');
  console.log('Peer is running');
}
