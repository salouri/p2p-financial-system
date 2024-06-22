// common/utils/handleShutdown.js
import {notifyPeersRequest} from '../../peer/peerRequestHandler.js';
import {saveKnownPeers} from '../../peer/manageKnownPeers.js';
import getAllPeers from '../../peer/getAllPeers.js';
import state from '../../common/state/index.js';

export default async function handleShutdown(swarm, storageDir) {
  async function gracefulShutdown() {
    const allPeers = getAllPeers();
    try {
      await state.db.close();
    } catch (error) {
      console.error('Error closing db:', error);
    }
    try {
      if (allPeers) {
        notifyPeersRequest(allPeers, 'Server is shutting down.');
        saveKnownPeers(storageDir, allPeers);
      }
    } catch (error) {
      console.error('Error notifying peers or saving connected ones:', error);
    }

    // on
    swarm.once('close', function () {
      process.exit();
    });

    swarm.destroy();

    // Ensure exit if swarm doesn't close in time
    setTimeout(() => process.exit(), 1000);
  }

  // Handle SIGINT (Ctrl+C)
  process.once('SIGINT', gracefulShutdown);

  // Handle SIGTERM (kill command)
  process.once('SIGTERM', gracefulShutdown);

  // Handle SIGHUP (terminal closing)
  process.once('SIGHUP', gracefulShutdown);

  // Handle SIGUSR1 and SIGUSR2 (user-defined signals)
  process.once('SIGUSR1', gracefulShutdown);
  process.once('SIGUSR2', gracefulShutdown);
}
