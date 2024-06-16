export async function handleSendTransaction(req, core) {
  try {
    const data = JSON.parse(req.toString());
    console.log('Received transaction-data:', data);
    const {sender, receiver, amount} = data;
    const transaction = {sender, receiver, amount, timeStamp: Date.now()};
    const logRecord = JSON.stringify({
      type: 'transaction',
      value: transaction,
    });
    await core.append(logRecord);
    return Buffer.from(
      JSON.stringify({status: true, transaction, index: core.length - 1}),
    );
  } catch (error) {
    console.error('Error sending transaction:', error);
    return Buffer.from(JSON.stringify({status: false, error: error.message}));
  }
}

export async function handleGetTransaction(req, core) {
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
    return Buffer.from(JSON.stringify(data));
  } catch (error) {
    console.error('Error getting transaction:', error);
    return Buffer.from(JSON.stringify({status: false, error: error.message}));
  }
}
