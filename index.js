import dotenv from 'dotenv';
import fs from 'fs-extra';
import {startNode} from './src/node-setup.js';

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

clearStorage(storageDir);

startNode(storageDir, serverPublicKey);
