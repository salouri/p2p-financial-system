export const sendTransactionRequest = async (client, receiverId, item) => {
  try {
    const requestPayload = Buffer.from(JSON.stringify({receiverId, item}));
    const response = await client.request('sendTransaction', requestPayload);
    return JSON.parse(response.toString());
  } catch (error) {
    console.error('Error sending transaction', error.message);
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

export const getTransactionRequest = async (client, transactionId) => {
  try {
    const requestBuffer = Buffer.from(JSON.stringify({transactionId}));
    const responseBuffer = await client.request(
      'getTransaction',
      requestBuffer,
    );
    return responseBuffer;
  } catch (error) {
    console.error('Error requesting transaction info:', error.message);
    return processRequestError(error);
  }
};

function processRequestError(error) {
  if (error.code === 'CHANNEL_CLOSED') {
    console.error('CHANNEL_CLOSED: channel closed');
    return {error: 'Channel closed'};
  } else {
    console.error('Error in sendTransactionRequest:', error.message);
    return {error: error.message};
  }
}

export default {
  sendTransactionRequest,
  sendPublicKeyRequest,
  getTransactionRequest,
};
