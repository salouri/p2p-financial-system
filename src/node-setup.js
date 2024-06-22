import {startNetwork} from './network/index.js';
import readline from 'readline';
import handleShutdown from './common/utils/handleShutdown.js';
import initializeDb from './common/utils/initializeDb.js';
import {defineServerEndpoints} from './server/defineEndpoints.js';
import {getActiveAuctionsFromDb} from './auction/auctionManager.js';
import defineServerResponds from './server/defineServerResponds.js';
import state from './common/state/index.js';
import eventEmitter from './common/events/eventEmitter.js';
import './common/events/eventHandlers.js';

export async function startNode(storageDir) {
  const rLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const {swarm, rpc, server} = await startNetwork(storageDir, rLine);

  const db = await initializeDb(storageDir);
  state.db = db;
  await getActiveAuctionsFromDb(db);

  await defineServerResponds(server);

  await defineServerEndpoints(rLine);

  console.log('Node is running');
  handleShutdown(swarm, storageDir);
}
