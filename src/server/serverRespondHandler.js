export const sendTransactionRespond = async (req, core, db) => {
  let response;
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
    if (db) {
      try {
        const transactionKey = transaction.timeStamp.toString();
        const transactionValue = transaction;
        await db.put(transactionKey, transactionValue);
      } catch (error) {
        console.error(error);
      }
    }
    response = {
      status: true,
      transaction: {...transaction},
      index: core.length - 1,
    };
  } catch (error) {
    console.error('Error sending transaction:', error);
    response = {status: false, error: error.message};
  }
  return Buffer.from(JSON.stringify(response));
};

export const getTransactionRespond = async (req, core) => {
  let response;
  try {
    console.log(
      'Received request for transaction:',
      JSON.parse(req.toString()),
    );
    const {index} = JSON.parse(req.toString());
    console.log('index: ', index);
    const dataBuffer = await core.get(index);
    response = JSON.parse(dataBuffer.toString());
    console.log('Retrieved transaction:', data);
  } catch (error) {
    console.error('Error getting transaction:', error);
    response = {status: false, error: error.message};
  }
  return Buffer.from(JSON.stringify(response));
};

export const sendPublicKeyRespond = publicKey => {
  console.log('Received request for sending public key');

  console.log(`Sending public key: ${publicKey.substring(0, 10)}...`);
  return Buffer.from(JSON.stringify({publicKey}));
};

export default {
  sendTransactionRespond,
  getTransactionRespond,
  sendPublicKeyRespond,
};
