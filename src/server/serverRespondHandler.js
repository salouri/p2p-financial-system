export const sendTransactionRespond = async (req, core) => {
  try {
    const data = JSON.parse(req.toString());
    console.log('Transaction Info:', data);
    const {sender, receiver, amount} = data;
    const transaction = {...data, timeStamp: Date.now()};
    const logRecord = JSON.stringify({
      type: 'transaction',
      value: transaction,
    });
    await core.append(logRecord);
    return {status: true, transaction, index: core.length - 1};
  } catch (error) {
    console.error('Error sending transaction:', error);
    return {status: false, error: error.message};
  }
};

export const getTransactionRespond = async (req, core) => {
  try {
    console.log(
      'Received request for transaction:',
      JSON.parse(req.toString()),
    );
    const {index} = JSON.parse(req.toString());
    console.log('index: ', index);
    const dataBuffer = await core.get(index);
    const data = JSON.parse(dataBuffer.toString());
    console.log('Retrieved transaction:', data);
    return data;
  } catch (error) {
    console.error('Error getting transaction:', error);
    return {status: false, error: error.message};
  }
};

export const sendPublicKeyRespond = publicKey => {
  console.log('Received request for sending public key');

  console.log('Sending public key:', publicKey);
  return {publicKey};
};

export default {
  sendTransactionRespond,
  getTransactionRespond,
  sendPublicKeyRespond,
};
