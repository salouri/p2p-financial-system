import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';
import {COMMON_TOPIC} from './config.js';
import {createCoreAndBee, registerRpcEvents} from './utils.js';

export async function startServer(storageDir) {
  const swarm = new Hyperswarm();
  console.log('Hyperswarm instance created');

  const {core, db} = await createCoreAndBee(storageDir);

  const dht = new DHT();
  const rpc = new RPC({dht});

  const discovery = swarm.join(COMMON_TOPIC, {
    server: true,
    client: true,
  });
  await discovery.flushed(); // Ensure the swarm is fully flushed and ready

  const server = rpc.createServer();

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

  server.on('connection', rpc => {
    console.log('Server connected to a peer');
    registerRpcEvents(rpc);

    if (rpc.write) {
      const serverPublicKey = rpc.publicKey
        ? rpc.publicKey.toString('hex')
        : 'No public key';
      console.log('Server public key:', serverPublicKey);
      rpc.write(JSON.stringify({publicKey: serverPublicKey}));
    }
  });

  // Print the server's public key for reference
  const serverPublicKey = rpc.defaultKeyPair.publicKey.toString('hex');
  console.log('Server public key:', serverPublicKey);

  console.log('Server is running...');
}
