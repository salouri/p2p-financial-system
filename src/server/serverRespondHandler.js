// serverRespondHandler.js
import {
  createAuction,
  placeBid,
  closeAuction,
} from '../auction/auctionManager.js';

export const createAuctionRespond = async (req, core, db) => {
  const {sellerId, item} = JSON.parse(req.toString());
  const auction = await createAuction(sellerId, item, core, db);
  return Buffer.from(JSON.stringify(auction));
};

export const placeBidRespond = async (req, core, db) => {
  const {auctionId, bidderId, amount} = JSON.parse(req.toString());
  let result;
  try {
    result = await placeBid(auctionId, bidderId, amount, core, db);
  } catch (error) {
    result = {error: error.message};
  }
  return Buffer.from(JSON.stringify(result));
};

export const closeAuctionRespond = async (req, core, db) => {
  const {auctionId} = JSON.parse(req.toString());
  let result;
  try {
    result = await closeAuction(auctionId, core, db);
  } catch (error) {
    result = {error: error.message};
  }
  return Buffer.from(JSON.stringify(result));
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

export default {
  createAuctionRespond,
  placeBidRespond,
  closeAuctionRespond,
  sendPublicKeyRespond,
  notifyPeersRespond,
};
