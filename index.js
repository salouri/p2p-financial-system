import dotenv from 'dotenv';
import path from 'path';
import {startNode} from './src/node-setup.js';
import {loadKnownPeers} from './src/network/index.js';
import checkBootstrapNodes from './src/common/utils/checkBootstrapNodes.js';
import config from './src/common/config/index.js';

dotenv.config();

if (await checkBootstrapNodes) {
  console.log('Bootstrap Nodes are running...');

  const [, , id, serverPublicKey] = process.argv;

  let storagePath = path.join('.', config.storageDir, `node-${id}`);

  // Load previously connected peers, if any, from a file
  const knownPeers = loadKnownPeers(storagePath);

  await startNode(storagePath, serverPublicKey);
} else {
  console.error('No bootstrap nodes available!');
}
