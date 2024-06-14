import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import {COMMON_TOPIC, VALUE_ENCODING} from './config.js';

export async function startPeer(storageDir, initialServerPublicKey = null) {
  if (initialServerPublicKey && initialServerPublicKey.length !== 64) {
    // 64 hex chars = 32 bytes
    throw new Error(
      `Initial server public key must be 32 bytes long, but got ${
        initialServerPublicKey.length / 2
      } bytes (${initialServerPublicKey.length} hex characters)`,
    );
  }
  const dht = new DHT();
  const rpc = new RPC({dht});

  let publicKeyBuffer;
  if (initialServerPublicKey) {
    publicKeyBuffer = Buffer.from(initialServerPublicKey, 'hex');
    if (publicKeyBuffer.length !== 32) {
      throw new Error('Initial server public key must be 32 bytes long');
    }
  } else {
    publicKeyBuffer = Buffer.alloc(32).fill(COMMON_TOPIC);
  }

  const client = rpc.connect(publicKeyBuffer);

  client.on('open', async () => {
    console.log('Client RPC connection opened');

    if (!initialServerPublicKey) {
      try {
        const {publicKey} = await client.request(
          'sendPublicKey',
          {},
          {valueEncoding: VALUE_ENCODING},
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

    const sendArgs = {sender: 'Alice', receiver: 'Bob', amount: 100};
    try {
      const sendResponse = await client.request('sendTransaction', sendArgs, {
        valueEncoding: VALUE_ENCODING,
      });
      console.log('Transaction sent:', sendResponse);
    } catch (error) {
      console.error('Error sending transaction:', error);
    }

    try {
      const getResponse = await client.request(
        'getTransaction',
        {index: 0},
        {
          valueEncoding: VALUE_ENCODING,
        },
      );
      console.log('Transaction received:', getResponse);
    } catch (error) {
      console.error('Error getting transaction:', error);
    }
  });

  // Lookup and connect to the server
  const topic = Buffer.alloc(32).fill(COMMON_TOPIC);
  dht.lookup(topic).on('data', data => {
    console.log('Found peer:', data);
    rpc.connect(data.from);
  });

  // Announce our presence on the topic
  console.log('Peer is running');
}
