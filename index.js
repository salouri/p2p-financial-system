import dotenv from 'dotenv';
import path from 'path';
import {startNode} from './src/node-setup.js';
import {loadKnownPeers} from './src/peer/manageKnownPeers.js';
import checkBootstrapNodes from './src/common/utils/checkBootstrapNodes.js';

dotenv.config();

if (await checkBootstrapNodes) {
  console.log('Bootstrap Nodes are running...');

  const [, , id, serverPublicKey] = process.argv;

  let storageDir = path.join('.', 'storage', `node-${id}`);

  // Load previously connected peers, if any, from a file
  const knownPeers = loadKnownPeers(storageDir);

  await startNode(storageDir, serverPublicKey);
} else {
  console.error('No bootstrap nodes available!');
}
