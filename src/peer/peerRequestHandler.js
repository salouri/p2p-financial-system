export const createAuctionRequest = async (client, sellerId, item) => {
  try {
    const requestPayload = Buffer.from(JSON.stringify({sellerId, item}));
    const response = await client.request('createAuction', requestPayload);
    return JSON.parse(response.toString());
  } catch (error) {
    console.error('Error: creating auction', error.message);
    return processRequestError(error);
  }
};
export const placeBidRequest = async (client, auctionId, bidderId, amount) => {
  try {
    const requestPayload = Buffer.from(
      JSON.stringify({auctionId, bidderId, amount}),
    );
    const response = await client.request('placeBid', requestPayload);
    return JSON.parse(response.toString());
  } catch (error) {
    console.error('Error: placing a bid', error.message);
    return processRequestError(error);
  }
};

export const closeAuctionRequest = async (client, auctionId) => {
  try {
    const requestPayload = Buffer.from(JSON.stringify({auctionId}));
    const response = await client.request('closeAuction', requestPayload);
    return JSON.parse(response.toString());
  } catch (error) {
    console.error('Error: closing auction', error.message);
    return processRequestError(error);
  }
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
    console.error('Error receiving peer public key:', error.message);
    return processRequestError(error);
  }
};

export const getAuctionRequest = async (client, auctionId) => {
  try {
    const requestBuffer = Buffer.from(JSON.stringify({auctionId}));
    const responseBuffer = await client.request('getAuction', requestBuffer);
    return responseBuffer;
  } catch (error) {
    console.error('Error requesting auction:', error.message);
    return processRequestError(error);
  }
};

function processRequestError(error) {
  if (error.code === 'CHANNEL_CLOSED') {
    console.error('CHANNEL_CLOSED: channel closed');
    return {error: 'Channel closed'};
  } else {
    console.error('Error in createAuctionRequest:', error.message);
    return {error: error.message};
  }
}

export default {
  createAuctionRequest,
  placeBidRequest,
  closeAuctionRequest,
  sendPublicKeyRequest,
  getAuctionRequest,
};
