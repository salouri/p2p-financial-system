import eventEmitter from './eventEmitter.js';
import state from '../state/index.js';
import getAllPeers from '../../peer/getAllPeers.js';
import requestHandlers from '../../peer/peerRequestHandler.js';

const broadcastMessageToPeers = (msg, data = null) => {
  const allPeers = getAllPeers();
  const message = `${msg} ${data ? ':' + JSON.stringify(data) : '.'}`;
  for (const {client} of allPeers) {
    try {
      client.event('notifyPeers', Buffer.from(JSON.stringify({message})));
    } catch (error) {
      console.error('Error notifying peer:', error);
    }
  }
};

eventEmitter.on('auctionCreated', auction => {
  broadcastMessageToPeers('New auction opened', auction);
});

eventEmitter.on('bidPlaced', bid => {
  broadcastMessageToPeers('New bid placed', bid);
});

eventEmitter.on('auctionClosed', auction => {
  broadcastMessageToPeers('Auction closed', auction);
});

eventEmitter.on('serverShutdown', () => {
  broadcastMessageToPeers('Server is shutting down.');
  const allPeers = getAllPeers();
  for (const {client} of allPeers) {
    client.destroy();
  }
});

eventEmitter.on('notifyPeers', message => {
  broadcastMessageToPeers(message, message?.data);
  console.log(`Peers notified with message: "${message}".`);
});

eventEmitter.on('peerConnected', client => {
  const activeAuctions = state.auctionManager.getCachedActiveAuctions();
  const message = {auctions: activeAuctions};
  try {
    client.event('notifyPeers', Buffer.from(JSON.stringify({message})));
  } catch (error) {
    console.error('Error notifying peer:', error);
  }
});

export default eventEmitter;
