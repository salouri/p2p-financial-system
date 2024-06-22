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
  broadcastMessageToPeers(bid, 'New bid placed');
});

eventEmitter.on('auctionClosed', auction => {
  broadcastMessageToPeers('Auction closed', auction);
});

// Define the handler for serverShutdown event
eventEmitter.on('serverShutdown', () => {
  broadcastMessageToPeers('Server is shutting down.');
  const allPeers = getAllPeers();
  for (const {client} of allPeers) {
    client.destroy();
  }
});

eventEmitter.on('notifyPeers', message => {
  broadcastMessageToPeers(message);
});

eventEmitter.on('peerConnected', rpcClient => {
  // Notify new peer about existing auctions using cached active auctions
  const activeAuctions = getCachedActiveAuctions();
  requestHandlers.notifyOnePeerRequest(rpcClient, {auctions: activeAuctions});
});

export default eventEmitter;
