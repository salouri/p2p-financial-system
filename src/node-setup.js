import {startNetwork} from './network/index.js';
import readline from 'readline';
import handleShutdown from './common/utils/handleShutdown.js';
import initializeDb from './common/utils/initializeDb.js';
import {defineServerEndpoints} from './server/defineEndpoints.js';
import AuctionManager from './auction/auctionManager.js';
import defineServerResponds from './server/defineServerResponds.js';
import state from './common/state/index.js';
import eventEmitter from './common/events/eventEmitter.js';
import './common/events/eventHandlers.js';

export async function startNode(storageDir) {
  // Initialize the database first
  const db = await initializeDb(storageDir);
  state.db = db; // Populate state with db

  // Create AuctionManager instance
  const auctionManager = new AuctionManager(
    state.db,
    state.activeAuctions,
    eventEmitter,
  );
  state.auctionManager = auctionManager; // Store auctionManager in state for global access

  await auctionManager.getActiveAuctionsFromDb(db); // Populate activeAuctions cache at startup

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
