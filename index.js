import dotenv from 'dotenv';
import fs from 'fs-extra';
import {startNode} from './src/node-setup.js';
import {loadKnownPeers} from './src/peer/manageKnownPeers.js';

dotenv.config();

const clearStorage = path => {
  if (process.env.NODE_ENV === 'development') {
    try {
      fs.removeSync(path);
      console.log('Storage cleared successfully');
    } catch (err) {
      console.error('Error clearing storage:', err);
    }
  }
};

const [, , id, serverPublicKey] = process.argv;

let storageDir = `./storage/node-${id}`;

// clearStorage(storageDir);

// Load previously connected peers, if any
const knownPeers = loadKnownPeers(storageDir);

await startNode(storageDir, serverPublicKey);
