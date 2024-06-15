import RPC from '@hyperswarm/rpc';
import dotenv from 'dotenv';
import DHT from 'hyperdht';
import { COMMON_TOPIC, VALUE_ENCODING } from './config.js';
import { createCoreAndBee, registerRpcEvents } from './utils.js';

dotenv.config();
export async function startServer(storageDir) {
  const keyPair = {
    publicKey: Buffer.from(process.env.PUBLIC_KEY, 'hex'),
    secretKey: Buffer.from(process.env.SECRET_KEY, 'hex'),
  };
  const dht = new DHT();
  await dht.ready();
  const rpc = new RPC({dht, keyPair});

  const server = rpc.createServer();
  const {core, hbee} = await createCoreAndBee(storageDir, VALUE_ENCODING);

  const serverPublicKey = rpc.defaultKeyPair.publicKey.toString('hex');

  // Register the methods for handling requests
  server.respond('sendPublicKey', async () => {
    console.log('Received request for sending public key');
    return {publicKey: serverPublicKey};
  });

  server.respond('sendTransaction', async req => {
    try {
      const data = JSON.parse(req.toString());
      console.log('Received transaction-data:', data);
      const {sender, receiver, amount} = data;
      const transaction = {sender, receiver, amount, timeStamp: Date.now()};
      const key = `transaction:${transaction.timeStamp}`;
      await hbee.put(key, transaction);
      return Buffer.from(JSON.stringify({status: true, key, transaction}));
    } catch (error) {
      console.error('Error sending transaction:', error);
      return Buffer.from(JSON.stringify({status: false, error}));
    }
  });

  server.respond('getTransaction', async req => {
    try {
      console.log(
        'Received request for transaction:',
        JSON.parse(req.toString()),
      );
      const {key} = JSON.parse(req.toString());
      console.log('key: ', key);
      let transaction;
      try {
        transaction = await hbee.get(key);
      } catch (error) {
        console.error(error);
        throw new Error('Error getting transaction!');
      }
      console.log('transaction: ', transaction);
      const data = transaction.value;
      console.log('data: ', data);
      return Buffer.from(JSON.stringify(data));
    } catch (error) {
      console.error('Error getting transaction:', error);
      return Buffer.from(JSON.stringify({status: false, error}));
    }
  });

  await server.listen();
  console.log('Server is listening...');

  console.log('Server public key:', serverPublicKey);

  const topic = Buffer.alloc(32).fill(COMMON_TOPIC);
  dht.announce(topic, rpc.defaultKeyPair, err => {
    if (err) {
      console.error('Failed to announce on DHT:', err);
      return;
    }
    console.log('Server announced on DHT.');
  });

  server.on('connection', rpc => {
    console.log('Server connected to a peer (through RPC)');
    registerRpcEvents(rpc);
  });

  console.log('Server is running');
}
