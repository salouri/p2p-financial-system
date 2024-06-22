// serverRespondHandler.js
import {
  createAuction,
  placeBid,
  closeAuction,
} from '../auction/auctionManager.js';
import getAllPeers from '../peer/getAllPeers.js';
import {notifyPeersRequest} from '../peer/peerRequestHandler.js';
import state from '../common/state/index.js';
export const createAuctionRespond = async req => {
  const {sellerId, item} = JSON.parse(req.toString());
  try {
    const auction = await createAuction(sellerId, item);
    broadcastAuctionUpdate(auction, 'New auction opened');
    return Buffer.from(JSON.stringify(auction));
  } catch (error) {
    return Buffer.from(JSON.stringify({error: error.message}));
  }
};

export const placeBidRespond = async req => {
  const {auctionId, bidderId, amount} = JSON.parse(req.toString());
  try {
    const bid = await placeBid(auctionId, bidderId, amount);
    broadcastAuctionUpdate(bid, 'New bid placed');
    return Buffer.from(JSON.stringify(bid));
  } catch (error) {
    return Buffer.from(JSON.stringify({error: error.message}));
  }
};

export const closeAuctionRespond = async req => {
  const {auctionId} = JSON.parse(req.toString());
  try {
    const auction = await closeAuction(auctionId);
    broadcastAuctionUpdate(auction, 'Acution Closed');
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

const broadcastAuctionUpdate = (auction, message) => {
  const allPeers = state.connectedPeers['bidders'].values();
  notifyPeersRequest(allPeers, `${message}: ${JSON.stringify(auction)}`);
};

export default {
  createAuctionRespond,
  placeBidRespond,
  closeAuctionRespond,
  sendPublicKeyRespond,
  notifyPeersRespond,
};
