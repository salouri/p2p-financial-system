import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';

export async function createCoreAndBee(storageDir) {
  const core = new Hypercore(storageDir, {valueEncoding: 'json'});
  console.log('Hypercore instance created with storage directory:', storageDir);
  await core.ready();

  const db = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: 'json',
  });
  console.log('Hyperbee instance created');

  return {core, db};
}

export function registerRpcEvents(rpc) {
  console.log('RPC Instance:', rpc);

  rpc.on('open', () => {
    console.log('RPC connection opened');
  });

  rpc.on('close', () => {
    console.log('RPC connection closed');
  });

  rpc.on('destroy', () => {
    console.log('RPC connection destroyed');
  });
}
