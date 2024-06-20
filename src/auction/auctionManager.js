import {v4 as uuidv4} from 'uuid';

const activeAuctions = new Map();

export const createAuction = async (sellerId, item, core, db) => {
  const auctionId = uuidv4();
  const auction = {
    id: auctionId,
    sellerId,
    item,
    bids: [], // each one is {bidderId, amount, timestamp};
    status: 'open',
    highestBid: null,
  };

  try {
    const logRecord = JSON.stringify({type: 'auction', value: auction});
    await core.append(logRecord);
    await db.put(auctionId, auction);
    activeAuctions.set(auction.id, auction);
  } catch (error) {
    console.error('Error saving auction to database!', error);
  }

  return auction;
};

export const getAuction = async (auctionId, db) => {
  const auction = await db.get(auctionId);
  return auction ? JSON.parse(auction) : null;
};

export const placeBid = async (auctionId, bidderId, amount, core, db) => {
  const auctionBuffer = await db.get(auctionId);
  if (auctionBuffer) {
    const auction = JSON.parse(auctionBuffer);
    if (auction.status === 'open') {
      const bid = {bidderId, amount, timestamp: Date.now()};
      auction.bids.push(bid);
      if (!auction.highestBid || amount > auction.highestBid.amount) {
        auction.highestBid = bid;
      }

      try {
        const logRecord = JSON.stringify({type: 'bid', value: bid});
        await core.append(logRecord);
        await db.put(auctionId, auction);
        activeAuctions.set(auction.id, auction);
      } catch (error) {
        console.error('Error saving bid to database!', error);
      }
    } else {
      throw new Error('Auction is already closed');
    }
  } else {
    throw new Error('Auction does not exist');
  }

  return bid;
};

export const closeAuction = async auctionId => {
  const auctionBuffer = await db.get(auctionId);
  if (auctionBuffer) {
    const auction = JSON.parse(auctionBuffer);
    if (auction.status === 'open') {
      auction.status = 'closed';
      try {
        const logRecord = JSON.stringify({
          type: 'closeAuction',
          value: auction,
        });
        await core.append(logRecord);
        await db.put(auctionId, auction);
        activeAuctions.delete(auctionId);
      } catch (error) {
        console.error('Error saving auction status to database!', error);
      }
    } else {
      throw new Error('Auction is already closed');
    }
  } else {
    throw new Error('Auction does not exist');
  }

  return auction;
};

export const getActiveAuctionsFromDb = async db => {
  const auctions = [];
  for await (const {value} of db.createReadStream({
    keys: false,
    values: true,
  })) {
    if (value.isActive) {
      auctions.push(value);
      activeAuctions.set(value.id, auction);
    }
  }
  return auctions;
};

export const getCachedActiveAuctions = () => {
  return Array.from(activeAuctions.values());
};
