import {v4 as uuidv4} from 'uuid';
import eventEmitter from '../common/events/eventEmitter.js';
import state from '../common/state/index.js';

export const createAuction = async (sellerId, item) => {
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
    await state.db.put(auctionId, auction); // Store auction object directly
    state.activeAuctions.set(auction.id, auction);
    eventEmitter.emit('auctionCreated', auction);
    return auction;
  } catch (error) {
    console.error('Error saving auction to database!', error);
    throw error;
  }

  return auction;
};

export const getAuction = async auctionId => {
  try {
    const auctionEntry = await state.db.get(auctionId);
    const auction = auctionEntry.value;
    return auction;
  } catch (error) {
    console.error('Error retrieving auction from database!', error);
    throw error;
  }
};

export const placeBid = async (auctionId, bidderId, amount) => {
  try {
    const auction = await getAuction(auctionId);
    if (auction) {
      if (auction.status === 'open') {
        const bid = {bidderId, amount, timestamp: Date.now()};
        auction.bids.push(bid);
        if (!auction.highestBid || amount > auction.highestBid.amount) {
          auction.highestBid = bid;
        }
        await state.db.put(auctionId, auction); // Update auction object directly
        state.activeAuctions.set(auction.id, auction);
        eventEmitter.emit('bidPlaced', bid);
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

export const closeAuction = async auctionId => {
  try {
    const auction = await getAuction(auctionId);
    if (auction) {
      if (auction.status === 'open') {
        auction.status = 'closed';
        await state.db.put(auctionId, auction); // Update auction as binary
        state.activeAuctions.delete(auctionId);
        eventEmitter.emit('auctionClosed', auction);
        return auction;
      } else {
        throw new Error('Auction is already closed');
      }
    } else {
      throw new Error('Auction does not exist');
    }
  } catch (error) {
    console.error('Error closing auction:', error);
    throw new Error(error.message);
  }
};

export const getActiveAuctionsFromDb = async () => {
  const auctions = [];
  try {
    for await (const {value} of state.db.createReadStream({
      keys: false,
      values: true,
    })) {
      // value here is auction
      if (value.status === 'open') {
        auctions.push(value);
        state.activeAuctions.set(value.id, value);
      }
    }
  } catch (error) {
    console.error('Error loading active auctions from database:', error);
    throw error;
  }
  return auctions;
};

export const getCachedActiveAuctions = () => {
  return Array.from(state.activeAuctions.values());
};
