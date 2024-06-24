import {startNetwork} from './network/index.js';
import readline from 'readline';
import handleShutdown from './common/utils/handleShutdown.js';
import initializeDb from './common/utils/initializeDb.js';
import {defineServerEndpoints} from './server/defineEndpoints.js';
import TransactionManager from './transaction/transactionManager.js';
import defineServerResponds from './server/defineServerResponds.js';
import state from './common/state/index.js';
import eventEmitter from './common/events/eventEmitter.js';
import './common/events/eventHandlers.js';

export async function startNode(storageDir) {
  // Initialize the database first
  const db = await initializeDb(storageDir);
  state.db = db; // Populate state with db

  // Create TransactionManager instance
  const transactionManager = new TransactionManager(state.db, eventEmitter);
  state.transactionManager = transactionManager; // Store transactionManager in state for global access

  // Initialize readline interface for user input
  const rLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Start the network with storageDir and rLine
  const {swarm, rpc, server} = await startNetwork(storageDir, rLine);

  // Define server responses and endpoints
  await defineServerResponds(server);
  await defineServerEndpoints(rLine);

  console.log('Node is running');
  handleShutdown(swarm, storageDir);
}
