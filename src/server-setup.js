import RPC from '@hyperswarm/rpc';
import dotenv from 'dotenv';
import DHT from 'hyperdht';
import { COMMON_TOPIC, VALUE_ENCODING } from './config.js';
import { createCoreAndBee, registerRpcEvents } from './utils.js';

dotenv.config();
export async function startServer(storageDir) {
  const {core, db} = await createCoreAndBee(storageDir, VALUE_ENCODING);

  const dht = new DHT();
  // Initialize the RPC server with the DHT instance
  const rpc = new RPC({dht});

  const server = rpc.createServer();

  // Register the methods for handling requests
  server.respond('sendPublicKey', async () => {
    console.log('Received request for sending public key');
    return {publicKey: rpc.defaultKeyPair.publicKey.toString('hex')};
  });

  server.respond('sendTransaction', async req => {
    const data = JSON.parse(req.toString());
    console.log('Received transaction details:', data);
    const {sender, receiver, amount} = data;
    const transaction = {sender, receiver, amount, timeStamp: Date.now()};
    const logRecord = JSON.stringify({type: 'transaction', value: transaction});
    await core.append(logRecord);
    return Buffer.from(JSON.stringify({status: true, transaction}));
  });

  server.respond('getTransaction', async req => {
    console.log(
      'Received request for transaction:',
      JSON.parse(req.toString()),
    );
    const {index} = JSON.parse(req.toString());
    const data = await core.get(index);
    return Buffer.from(JSON.stringify(data));
  });

  await server.listen();
  console.log('Server is listening...');

  const serverPublicKey = rpc.defaultKeyPair.publicKey.toString('hex');
  console.log('Server public key:', serverPublicKey);
  // check if public key is 32 bytes:
  if (serverPublicKey.length !== 64) {
    throw new Error('Server public key is not 32 bytes');
  }

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
