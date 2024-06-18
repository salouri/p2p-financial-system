import dotenv from 'dotenv';
import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';

dotenv.config();

const publicKey = Buffer.from(process.env.PUBLIC_KEY, 'hex');
const secretKey = Buffer.from(process.env.SECRET_KEY, 'hex');
export default async function createCoreAndBee(storageDir, encoding) {
  const core = new Hypercore(
    storageDir,
    publicKey,
    {secretKey},
    {valueEncoding: encoding},
  );
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
