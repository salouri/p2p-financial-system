import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';

export async function createCoreAndBee(storageDir, encoding) {
  const core = new Hypercore(storageDir, {valueEncoding: encoding});
  await core.ready();
  console.log('Hypercore instance created');

  const db = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: encoding,
  });
  await db.ready();
  console.log('Hyperbee instance created');

  return {core, db};
}
