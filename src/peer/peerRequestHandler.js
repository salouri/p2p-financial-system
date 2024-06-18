export const sendPublicKeyRequest = async client => {
  try {
    console.log('Requesting Peer-Public-Key...');
    const response = await client.request('sendPublicKey', Buffer.alloc(0));
    const parsedRes = JSON.parse(response?.toString() || '{}');
    const {publicKey} = parsedRes;
    console.log('Peer Public Key: ', publicKey);
    return publicKey;
  } catch (error) {
    console.error('Error receiving peer public key:', error);
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
      Buffer.from(JSON.stringify({...transactionInfo})),
    );
    const parsedRes = JSON.parse(sendTransactionRes.toString());
    const {status, transaction, index} = parsedRes;
    console.log('Transaction sent: ', parsedRes);
    const logRecord = JSON.stringify({
      type: 'transaction',
      value: transaction,
    });
    await core.append(logRecord);
    if (db) {
      try {
        const transactionKey = transaction.timeStamp.toString();
        const transactionValue = transaction;
        await db.put(transactionKey, transactionValue);
      } catch (error) {
        console.error(error);
      }
    }
    return parsedRes;
  } catch (error) {
    console.error('Error sending transaction:', error);
  }
};

export default {
  sendTransactionRequest,
  getTransactionRequest,
  sendPublicKeyRequest,
};
