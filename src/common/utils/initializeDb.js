// common/utils/initializeDb.js
import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';
import RAM from 'random-access-memory';
import config from '../config/index.js';

// Function to initialize a Hyperbee instance
const initializeDb = async (storageDir, valueEncoding = 'json') => {
  // fixed shared keyPair ensures replicated feed among peers
  const storageLoc = config.inDevelopment ? () => new RAM() : storageDir;

  const core = new Hypercore(storageLoc, config.keyPair, {valueEncoding});
  await core.ready();

  const db = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding,
  });
  await db.ready();

  return db;
};

export default initializeDb;
