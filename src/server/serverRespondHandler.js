import eventEmitter from '../common/events/eventEmitter.js';

export const sendTransactionRespond = async req => {
  const {receiverId, item} = JSON.parse(req.toString());
  try {
    const transaction = await state?.transactionManager?.sendTransaction(
      receiverId,
      item,
    );
    return Buffer.from(JSON.stringify(transaction));
  } catch (error) {
    return Buffer.from(JSON.stringify({error: error.message}));
  }
};

export const sendPublicKeyRespond = publicKey => {
  console.log('Received request for sending public key');
  console.log(`Sending public key: ${publicKey.substring(0, 10)}...`);
  return Buffer.from(JSON.stringify({publicKey}));
};

export const notifyPeersRespond = req => {
  const {message} = JSON.parse(req.toString());
  console.log('>>> Notification received! \n Message: ', message);
};

export const getTransactionRespond = async req => {
  const {transactionId} = JSON.parse(req.toString());
  try {
    const transaction = await state?.transactionManager?.getTransaction(
      transactionId,
    );
    return Buffer.from(JSON.stringify(transaction));
  } catch (error) {
    return Buffer.from(JSON.stringify({error: error.message}));
  }
};

export default {
  sendTransactionRespond,
  sendPublicKeyRespond,
  notifyPeersRespond,
  getTransactionRespond,
};
