import RPC from '@hyperswarm/rpc';
import dotenv from 'dotenv';
import DHT from 'hyperdht';
import {BOOTSTRAP_NODES, COMMON_TOPIC} from '../common/config.js';
import {handleGetTransaction, handleSendTransaction} from './serverHandlers.js';
import {createCoreAndBee} from './utils/createCoreAndBee.js';
import {registerRpcEvents} from './utils/registerRpcEvents.js';

dotenv.config();
export async function startServer(storageDir) {
  const {core} = await createCoreAndBee(storageDir, 'json');

  const keyPair = {
    publicKey: Buffer.from(process.env.PUBLIC_KEY, 'hex'),
    secretKey: Buffer.from(process.env.SECRET_KEY, 'hex'),
  };
  const dht = new DHT({bootstrap: BOOTSTRAP_NODES});

  const topic = Buffer.alloc(32).fill(COMMON_TOPIC);
  dht.on('ready', async () => {
    console.log('DHT node is ready');
    await dht.announce(topic, keyPair);
    console.log('Announced on DHT');

    const stream = dht.lookup(topic);
    stream.on('data', data => {
      console.log('Peer found:', data);
    });
  });
  await dht.ready();

  const rpc = new RPC({dht, keyPair});
  const server = rpc.createServer({keyPair});

  const serverPublicKey = rpc.defaultKeyPair.publicKey.toString('hex');

  server.respond('sendPublicKey', async () => {
    console.log('Received request for sending public key');
    return Buffer.from(JSON.stringify({publicKey: serverPublicKey}));
  });

  server.respond('sendTransaction', async req => {
    return await handleSendTransaction(req, core);
  });

  server.respond('getTransaction', async req => {
    return await handleGetTransaction(req, core);
  });

  await server.listen();
  console.log('Server is listening...');

  console.log('Server public key:', serverPublicKey);

  if (Buffer.from(serverPublicKey, 'hex').length !== 32) {
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
