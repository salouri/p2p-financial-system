import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import {startNode} from './src/node-setup.js';
import checkBootstrapNodes from './src/common/utils/checkBootstrapNodes.js';
import config from './src/common/config/index.js';

dotenv.config();

async function main() {
  const bootstrapsRunning = await checkBootstrapNodes();
  if (bootstrapsRunning) {
    console.log('Bootstrap Nodes are running...');

    const peerId = process.argv[2];
    if (!peerId) {
      console.error('No peer ID provided. Usage: npm run start -- <peer-id>');
      process.exit(1);
    }

    const storagePath = path.join('.', config.storageDir, `peer-${peerId}`);

    // Create the directory if it doesn't exist
    try {
      await fs.mkdir(storagePath, {recursive: true});
    } catch (error) {
      console.error(`Failed to create storage directory: ${error.message}`);
      process.exit(1);
    }

    // Start the node with the specified storage path
    try {
      console.log(`Starting a node with storage path: ${storagePath}`);
      await startNode(storagePath);
    } catch (error) {
      console.error(`Failed to start node: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.error('No bootstrap nodes available!');
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`An error occurred: ${error.message}`);
  process.exit(1);
});
