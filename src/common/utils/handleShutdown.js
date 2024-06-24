// common/utils/handleShutdown.js
import state from '../../common/state/index.js';
import eventEmitter from '../events/eventEmitter.js';
import {savePeerConnections} from '../../network/index.js';

export default async function handleShutdown(swarm, storageDir) {
  async function gracefulShutdown() {
    const peers = state.connectedPeers;

    try {
      if (peers.length) {
        eventEmitter.emit('serverShutdown');
        await savePeerConnections(state.db, peers);
      }
    } catch (error) {
      console.error('Error notifying peers or saving connected ones:', error);
    }

    try {
      await state.db.close();
    } catch (error) {
      console.error('Error closing db:', error);
    }

    swarm.once('close', function () {
      process.exit();
    });

    swarm.destroy();

    // Ensure exit if swarm doesn't close in time
    setTimeout(() => process.exit(), 3000);
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
