import {
  createAuction,
  placeBid,
  closeAuction,
  getAuction,
} from '../auction/auctionManager.js';
import eventEmitter from '../common/events/eventEmitter.js';

export const createAuctionRespond = async req => {
  const {sellerId, item} = JSON.parse(req.toString());
  try {
    const auction = await createAuction(sellerId, item);
    return Buffer.from(JSON.stringify(auction));
  } catch (error) {
    return Buffer.from(JSON.stringify({error: error.message}));
  }
};

export const placeBidRespond = async req => {
  const {auctionId, bidderId, amount} = JSON.parse(req.toString());
  try {
    const bid = await placeBid(auctionId, bidderId, amount);
    return Buffer.from(JSON.stringify(bid));
  } catch (error) {
    return Buffer.from(JSON.stringify({error: error.message}));
  }
};

export const closeAuctionRespond = async req => {
  const {auctionId} = JSON.parse(req.toString());
  try {
    const auction = await closeAuction(auctionId);
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

export const getAuctionRespond = async req => {
  const {auctionId} = JSON.parse(req.toString());
  try {
    const auction = await getAuction(auctionId);
    return Buffer.from(JSON.stringify(auction));
  } catch (error) {
    return Buffer.from(JSON.stringify({error: error.message}));
  }
};

export default {
  createAuctionRespond,
  placeBidRespond,
  closeAuctionRespond,
  sendPublicKeyRespond,
  notifyPeersRespond,
  getAuctionRespond,
};
