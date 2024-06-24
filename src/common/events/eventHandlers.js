// common/events/eventHandlers.js
import eventEmitter from './eventEmitter.js';
import transactionManager from '../../transaction/transactionManager.js';
import state from '../state/index.js';
import getClientPublicKey from '../../peer/getClientPublicKey.js';

// Register event handlers

// Handle notifying peers with a message or stringified data
eventEmitter.on('notifyPeers', (msgString, data = null) => {
  const message = `${msgString}${data ? ': ' + JSON.stringify(data) : '.'}`;
  console.log('message: ', message);
  broadcastMessageToPeers(message);
});

// Handle peer connections
eventEmitter.on('peerConnected', client => {
  const publicKey = getClientPublicKey(client);
  console.log(
    'New peer connected:',
    `Public Key: ${publicKey ? publicKey?.substring(0, 10) : ''}...`,
  );
  // Optionally, send the client the current state or any initial data
});

// Handle server shutdown
eventEmitter.on('serverShutdown', async () => {
  console.log('Server is shutting down...');
  const peers = [...state.connectedPeers.values()];
  peers.forEach(({client}) => {
    client.destroy();
  });
  await state.db.close();
  console.log('Database closed.');
});

function broadcastMessageToPeers(message) {
  const peers = [...state.connectedPeers.values()];
  peers.forEach(({client}) => {
    try {
      client.event('notifyPeers', Buffer.from(JSON.stringify({message})));
    } catch (error) {
      console.error('Error notifying peer:', error);
    }
  });
}
export default eventEmitter;
