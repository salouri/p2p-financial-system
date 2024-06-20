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
    await db.put(auctionId, JSON.stringify(auction)); // Ensure data is stored as a string
    activeAuctions.set(auction.id, auction);
  } catch (error) {
    console.error('Error saving auction to database!', error);
  }

  return auction;
};

export const getAuction = async (auctionId, db) => {
  try {
    const auctionBuffer = await db.get(auctionId);
    return auctionBuffer ? JSON.parse(auctionBuffer.toString()) : null; // Ensure correct decoding
  } catch (error) {
    console.error('Error retrieving auction from database!', error);
    return null;
  }
};

export const placeBid = async (auctionId, bidderId, amount, core, db) => {
  try {
    const auctionBuffer = await db.get(auctionId);
    if (auctionBuffer) {
      const auction = JSON.parse(auctionBuffer.toString());
      if (auction.status === 'open') {
        const bid = {bidderId, amount, timestamp: Date.now()};
        auction.bids.push(bid);
        if (!auction.highestBid || amount > auction.highestBid.amount) {
          auction.highestBid = bid;
        }

        const logRecord = JSON.stringify({type: 'bid', value: bid});
        await core.append(logRecord);
        await db.put(auctionId, JSON.stringify(auction));
        activeAuctions.set(auction.id, auction);

        return bid;
      } else {
        throw new Error('Auction is already closed');
      }
    } else {
      throw new Error('Auction does not exist');
    }
  } catch (error) {
    console.error('Error placing bid:', error);
    throw error;
  }
};

export const closeAuction = async (auctionId, core, db) => {
  try {
    const auctionBuffer = await db.get(auctionId);
    if (auctionBuffer) {
      const auction = JSON.parse(auctionBuffer.toString());
      if (auction.status === 'open') {
        auction.status = 'closed';

        const logRecord = JSON.stringify({
          type: 'closeAuction',
          value: auction,
        });
        await core.append(logRecord);
        await db.put(auctionId, JSON.stringify(auction));
        activeAuctions.delete(auctionId);

        return auction;
      } else {
        throw new Error('Auction is already closed');
      }
    } else {
      throw new Error('Auction does not exist');
    }
  } catch (error) {
    console.error('Error closing auction:', error);
    throw error;
  }
};

export const getActiveAuctionsFromDb = async db => {
  const auctions = [];
  try {
    for await (const {value} of db.createReadStream({
      keys: false,
      values: true,
    })) {
      const auction = JSON.parse(value.toString());
      if (auction.status === 'open') {
        auctions.push(auction);
        activeAuctions.set(auction.id, auction);
      }
    }
  } catch (error) {
    console.error('Error loading active auctions from database:', error);
  }
  return auctions;
};

export const getCachedActiveAuctions = () => {
  return Array.from(activeAuctions.values());
};
