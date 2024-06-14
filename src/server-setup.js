import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import {COMMON_TOPIC, VALUE_ENCODING} from './config.js';
import {createCoreAndBee, registerRpcEvents} from './utils.js';

export async function startServer(storageDir) {
  const {core, db} = await createCoreAndBee(storageDir, VALUE_ENCODING);

  const dht = new DHT();
  // Initialize the RPC server with the DHT instance
  const rpc = new RPC({dht});

  // Join the common topic for discovery
  const topic = Buffer.alloc(32).fill(COMMON_TOPIC);
  const server = rpc.createServer();

  // Register the methods for handling requests
  server.respond('sendPublicKey', async () => {
    return {publicKey: rpc.defaultKeyPair.publicKey.toString('hex')};
  });

  server.respond('sendTransaction', async req => {
    const {sender, receiver, amount} = req;
    const transaction = {sender, receiver, amount, timeStamp: Date.now()};
    await core.append({type: 'transaction', value: transaction});
    return {status: true, transaction};
  });

  server.respond('getTransaction', async req => {
    const {index} = req;
    const data = await core.get(index);
    return data;
  });

  await server.listen();
  console.log('Server listening...');

  // Ensure key pair is generated correctly and is 32 bytes long
  const keyPair = dht.defaultKeyPair;
  if (keyPair.publicKey.byteLength !== 32) {
    throw new Error('Generated public key is not 32 bytes long');
  }

  const serverPublicKey = keyPair.publicKey.toString('hex');
  //   const serverPublicKey = rpc.defaultKeyPair.publicKey.toString('hex');
  console.log('Server public key:', serverPublicKey);
  if (serverPublicKey.length !== 64) {
    throw new Error(
      `Server public key must be 32 bytes long, but got ${
        serverPublicKey.length / 2
      } bytes (${serverPublicKey.length} hex characters)`,
    );
  }

  dht.announce(topic, {keyPair: rpc.defaultKeyPair});
  console.log('Server announced on DHT.');

  server.on('connection', client => {
    // client: rpc client
    console.log('Server connected to a peer');
    registerRpcEvents(client);
  });

  console.log('Server is running');
}
