export const sendPublicKeyRequest = async client => {
  try {
    console.log('Requesting Server-Public-Key...');
    const response = await client.request('sendPublicKey', Buffer.alloc(0));
    const parsedRes = JSON.parse(response?.toString() || '{}');
    const {publicKey} = parsedRes;
    console.log('Server Public Key: ', publicKey);
    return publicKey;
  } catch (error) {
    console.error('Error receiving server public key:', error);
  }
};

export const getTransactionRequest = async (client, index) => {
  if (index === undefined) {
    console.error('Invalid getTransaction command');
    return;
  }
  try {
    console.log('Requesting Transaction...');
    const getTransactionRes = await client.request(
      'getTransaction',
      Buffer.from(JSON.stringify({index})),
    );
    const parsedRes = JSON.parse(getTransactionRes.toString());
    const transaction = parsedRes.value;
    console.log('Transaction: ', transaction);
    return transaction;
  } catch (error) {
    console.error('Error receiving transaction:', error);
  }
};

export const sendTransactionRequest = async (client, transactionInfo) => {
  const {sender, receiver, amount} = transactionInfo;
  if (!sender || !receiver || !amount) {
    console.error('Invalid sendTransaction command');
    return;
  }
  try {
    console.log('Sending Transaction...');
    const sendTransactionRes = await client.request(
      'sendTransaction',
      Buffer.from(JSON.stringify({transactionInfo})),
    );
    const parsedRes = JSON.parse(sendTransactionRes.toString());
    const {success} = parsedRes;
    console.log('Transaction sent: ', success);
    return success;
  } catch (error) {
    console.error('Error sending transaction:', error);
  }
};

export default {
  sendTransactionRequest,
  getTransactionRequest,
  sendPublicKeyRequest,
};
