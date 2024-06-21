// common/utils/initializeDb.js
import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';
import RAM from 'random-access-memory';
import dotenv from 'dotenv';

dotenv.config();

const inDevelopment = process.env.NODE_ENV === 'development';
// Function to initialize a Hyperbee instance
const initializeDb = async (storageDir, valueEncoding = 'json') => {
  // fixed shared keyPair ensures replicated feed among peers
  const keyPair = {
    publicKey: Buffer.from(process.env.PUBLIC_KEY, 'hex'),
    secretKey: Buffer.from(process.env.SECRET_KEY, 'hex'),
  };

  const storageLoc = inDevelopment ? () => new RAM() : storageDir;

  const core = new Hypercore(storageLoc, keyPair, {valueEncoding});
  await core.ready();

  const db = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding,
  });
  await db.ready();

  return db;
};

export default initializeDb;
