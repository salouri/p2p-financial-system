// serverRespondHandler.js
import {
  createAuction,
  placeBid,
  closeAuction,
} from '../auction/auctionManager.js';
import getAllPeers from '../peer/getAllPeers.js';
import {notifyPeersRequest} from '../peer/peerRequestHandler.js';

export const createAuctionRespond = async (req, db, connectedPeers) => {
  const {sellerId, item} = JSON.parse(req.toString());
  try {
    const auction = await createAuction(sellerId, item, db);
    broadcastAuctionUpdate(auction, connectedPeers, 'New auction opened');
    return Buffer.from(JSON.stringify(auction));
  } catch (error) {
    return Buffer.from(JSON.stringify({error: error.message}));
  }
};

export const placeBidRespond = async (req, db, connectedPeers) => {
  const {auctionId, bidderId, amount} = JSON.parse(req.toString());
  try {
    const bid = await placeBid(auctionId, bidderId, amount, db);
    broadcastAuctionUpdate(bid, connectedPeers, 'New bid placed');
    return Buffer.from(JSON.stringify(bid));
  } catch (error) {
    return Buffer.from(JSON.stringify({error: error.message}));
  }
};

export const closeAuctionRespond = async (req, db, connectedPeers) => {
  const {auctionId} = JSON.parse(req.toString());
  try {
    const auction = await closeAuction(auctionId, db);
    broadcastAuctionUpdate(auction, connectedPeers, 'Acution Closed');
    return Buffer.from(JSON.stringify(auction));
  } catch (error) {
    return Buffer.from(JSON.stringify({error: error.message}));
  }
};

export const sendPublicKeyRespond = publicKey => {
  console.log('Received request for sending public key');
  console.log(`Sending public key: ${publicKey.substring(0, 10)}...`);
  return Buffer.from(JSON.stringify({publicKey}));
};

export const notifyPeersRespond = req => {
  const {message} = JSON.parse(req.toString());
  console.log('>>> Notification received! \n Message: ', message);
};

const broadcastAuctionUpdate = (auction, connectedPeers, message) => {
  const allPeers = connectedPeers['bidders'].values();
  notifyPeersRequest(allPeers, `${message}: ${JSON.stringify(auction)}`);
};

export default {
  createAuctionRespond,
  placeBidRespond,
  closeAuctionRespond,
  sendPublicKeyRespond,
  notifyPeersRespond,
};
