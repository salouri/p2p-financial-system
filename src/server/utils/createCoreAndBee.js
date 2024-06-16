import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';

export async function createCoreAndBee(storageDir, valueEncoding) {
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
