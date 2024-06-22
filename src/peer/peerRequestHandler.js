export const createAuctionRequest = async (client, sellerId, item) => {
  const requestPayload = Buffer.from(JSON.stringify({sellerId, item}));
  const response = await client.request('createAuction', requestPayload);
  return JSON.parse(response.toString());
};

export const placeBidRequest = async (client, auctionId, bidderId, amount) => {
  const requestPayload = Buffer.from(
    JSON.stringify({auctionId, bidderId, amount}),
  );
  const response = await client.request('placeBid', requestPayload);
  return JSON.parse(response.toString());
};

export const closeAuctionRequest = async (client, auctionId) => {
  const requestPayload = Buffer.from(JSON.stringify({auctionId}));
  const response = await client.request('closeAuction', requestPayload);
  return JSON.parse(response.toString());
};

export const sendPublicKeyRequest = async client => {
  try {
    console.log('Requesting Public-Key from remote node...');
    const response = await client.request('sendPublicKey', Buffer.alloc(0));
    const parsedRes = JSON.parse(response?.toString() || '{}');
    const {publicKey} = parsedRes;
    console.log('Received Peer Public Key: ', publicKey);
    return publicKey;
  } catch (error) {
    console.error('Error receiving peer public key:', error);
  }
};

export default {
  createAuctionRequest,
  placeBidRequest,
  closeAuctionRequest,
  sendPublicKeyRequest,
};
