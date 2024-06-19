// common/utils/initializeDb.js
import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';
import dotenv from 'dotenv';

dotenv.config();

// Function to initialize a Hyperbee instance
export async function initializeDb({
  storageDir,
  keyPair,
  valueEncoding = 'json',
}) {
  if (!keyPair) {
    keyPair = {
      publicKey: Buffer.from(process.env.PUBLIC_KEY, 'hex'),
      secretKey: Buffer.from(process.env.SECRET_KEY, 'hex'),
    };
  }
  const core = new Hypercore(storageDir, keyPair, {valueEncoding});
  await core.ready();

  const db = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding,
  });
  await db.ready();

  return {core, db};
}
