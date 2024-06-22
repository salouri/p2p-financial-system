import eventEmitter from './eventEmitter.js';
import state from '../state/index.js';
import getAllPeers from '../../peer/getAllPeers.js';
import requestHandlers from '../../peer/peerRequestHandler.js';
import {getCachedActiveAuctions} from '../../auction/auctionManager.js';
// notify
const broadcastMessageToPeers = (message, data = null) => {
  const allPeers = getAllPeers();
  if (allPeers.length)
    requestHandlers.notifyPeersRequest(
      allPeers,
      `${message} ${data ? ':' + JSON.stringify(data) : '.'}`,
    );
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
  const allPeers = getAllPeers();
  for (const {client} of allPeers) {
    try {
      client.event('notifyPeers', Buffer.from(JSON.stringify({message})));
    } catch (error) {
      console.error('Error notifying peer:', error);
    }
  }

  console.log(`Peers notified with message: "${message}".`);
});

eventEmitter.on('peerConnected', client => {
  const activeAuctions = getCachedActiveAuctions();
  const message = {auctions: activeAuctions};
  try {
    client.event('notifyPeers', Buffer.from(JSON.stringify({message})));
  } catch (error) {
    console.error('Error notifying peer:', error);
  }
});

export default eventEmitter;
