// serverRespondHandler.js
import {
  createAuction,
  placeBid,
  closeAuction,
} from '../auction/auctionManager.js';

export const createAuctionRespond = async (req, core, db) => {
  const {sellerId, item} = JSON.parse(req.toString());
  const auction = createAuction(sellerId, item);
  const logRecord = JSON.stringify({
    type: 'auction',
    value: auction,
  });
  await core.append(logRecord);
  if (db) {
    try {
      const auctionKey = auction.id;
      await db.put(auctionKey, auction);
    } catch (error) {
      console.error(error);
    }
  }

  return Buffer.from(JSON.stringify(auction));
};

export const placeBidRespond = async (req, core, db) => {
  const {auctionId, bidderId, amount} = JSON.parse(req.toString());
  let result;
  try {
    result = placeBid(auctionId, bidderId, amount);
    const logRecord = JSON.stringify({
      type: 'bid',
      value: result,
    });

    await core.append(logRecord);
    if (db) {
      try {
        const bidKey = `${auctionId}:${result.timestamp}`;
        await db.put(bidKey, result);
      } catch (error) {
        console.error(error);
      }
    }
  } catch (error) {
    result = {error: error.message};
  }
  return Buffer.from(JSON.stringify(result));
};

export const closeAuctionRespond = async (req, core, db) => {
  const {auctionId} = JSON.parse(req.toString());
  let result;
  try {
    result = closeAuction(auctionId); // returns auction
    const logRecord = JSON.stringify({
      type: 'closeAuction',
      value: result,
    });

    await core.append(logRecord);
    if (db) {
      try {
        const auctionKey = auctionId;
        await db.put(auctionKey, result);
      } catch (error) {
        console.error(error);
      }
    }
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
  console.log('>>> Notificaiton received! \n Message: ', message);
};

export default {
  closeAuctionRespond,
  placeBidRespond,
  closeAuctionRespond,
  sendPublicKeyRespond,
  notifyPeersRespond,
};
