import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';
import DHT from 'hyperdht';

export async function createCoreAndBee(storageDir, valueEncoding = 'json') {
  const core = new Hypercore(storageDir, {valueEncoding});
  console.log('Hypercore instance created with storage directory:', storageDir);
  await core.ready();

  const db = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding,
  });
  console.log('Hyperbee instance created');

  return {core, db};
}

export function registerRpcEvents(rpcClient) {
  rpcClient.on('open', () => {
    console.log('RPC connection opened');
  });

  rpcClient.on('close', () => {
    console.log('RPC connection closed');
  });

  rpcClient.on('destroy', () => {
    console.log('RPC connection destroyed');
  });
}

export function generateKeys() {
  const keys = DHT.keyPair();
  const publicKey = keys.publicKey.toString('hex');
  const secretKey = keys.secretKey.toString('hex');
  return {publicKey, secretKey};
}

