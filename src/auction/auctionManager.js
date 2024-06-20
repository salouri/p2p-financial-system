import {v4 as uuidv4} from 'uuid';

export const createAuction = (sellerId, item, core, db) => {
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
  const logRecord = JSON.stringify({ type: 'auction', value: auction });
  await core.append(logRecord);
  await db.put(auctionId, auction);
} catch (error) {
  console.error('Error saving auction to database!', error)
}

  return auction;
};

export const getAuction = (auctionId, db)  => {
  const auction = await db.get(auctionId);
  return auction ? JSON.parse(auction) : null;
};

export const placeBid = (auctionId, bidderId, amount, core, db) => {
  const auctionBuffer = await db.get(auctionId);
  if (!auctionBuffer) {
    throw new Error('Auction does not exist');
  }

  const auction = JSON.parse(auctionBuffer);
  if (auction?.status !== 'open') {
    throw new Error('Auction is closed');
  }

    const bid = {bidderId, amount, timestamp: Date.now()};
    auction.bids.push(bid);
    if (!auction.highestBid || amount > auction.highestBid.amount) {
      auction.highestBid = bid;
    }

    try {
      const logRecord = JSON.stringify({ type: 'bid', value: bid });
      await core.append(logRecord);
      await db.put(auctionId, auction);
    } catch (error) {
      console.error('Error saving bid to database!', error)
    }

    return bid;

};

export const closeAuction = auctionId => {
  const auctionBuffer = await db.get(auctionId);
  if (!auctionBuffer) {
    throw new Error('Auction does not exist');
  }

  const auction = JSON.parse(auctionBuffer);
  if (auction.status !== 'open') {
    throw new Error('Auction is already closed');
  }

    auction.status = 'closed';

    try {
      const logRecord = JSON.stringify({ type: 'closeAuction', value: auction });
      await core.append(logRecord);
      await db.put(auctionId, auction);
    } catch (error) {
      console.error('Error saving auction status to database!', error)
    }

    return auction;
};
