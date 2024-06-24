import respondHandlers from './serverRespondHandler.js';
import requestHandlers from '../peer/peerRequestHandler.js';
import eventEmitter from '../common/events/eventEmitter.js';
import state from '../common/state/index.js';
import config from '../common/config/index.js';

export async function defineServerEndpoints(rline) {
  rline.on('line', async input => {
    const [command, ...jsonData] = input.split(' ');
    try {
      let data = {};
      if (jsonData.length > 0) {
        const dataStr = jsonData.join(' ');
        data = JSON.parse(dataStr || '{}');
      }
      const message = data?.message || 'Broadcast message to all peers';
      const transactionId = data?.TransactionId || '';

      switch (command) {
        case 'sendMyTransaction':
          const {localSellerId, localItem} = data;
          const transactionBuffer = Buffer.from(
            JSON.stringify({receiverId: localSellerId, item: localItem}),
          );
          const localTransRes = await respondHandlers.sendTransactionRespond(
            transactionBuffer,
          );
          console.log(
            'Local Transaction Details:',
            JSON.parse(localTransRes.toString()),
          );
          break;

        case 'getMyTransaction':
          const localTransactionRes =
            await respondHandlers.getTransactionRespond(
              Buffer.from(JSON.stringify({transactionId})),
            );
          console.log(
            'Transaction Details:',
            JSON.parse(localTransactionRes.toString()),
          );
          break;

        case 'notifyPeers':
          eventEmitter.emit('notifyPeers', message);
          break;

        default:
          if (!config.systemEndpoints.has(command))
            console.log('Unknown command');
      }
    } catch (error) {
      console.error('Error processing command:', error);
    }
  });
}

export async function defineClientEndpoints(client, rline) {
  rline.on('line', async input => {
    const [command, ...jsonData] = input.split(' ');
    try {
      let data = {};
      if (jsonData.length > 0) {
        const dataStr = jsonData.join(' ');
        data = JSON.parse(dataStr);
      }
      const message = data?.message || 'Broadcast message to all peers';
      const transactionId = data?.TransactionId || '';

      if (state.connectedPeers.size === 0) {
        console.log('No clients connected. Unable to execute this command.');
        return;
      }

      switch (command) {
        case 'sendPublicKey':
          await requestHandlers.sendPublicKeyRequest(client);
          break;

        case 'sendTransaction':
          const {receiverId, item} = data;
          const auctionResponse = await requestHandlers.sendTransactionRequest(
            client,
            receiverId,
            item,
          );
          console.log('Transaction Created:', auctionResponse);
          break;

        case 'getTransaction':
          const auctionRes = await requestHandlers.getTransactionRequest(
            client,
            transactionId,
          );
          console.log(
            'Transaction Details:',
            JSON.parse(auctionRes.toString()),
          );
          break;

        default:
          if (!config.systemEndpoints.has(command))
            console.log('Unknown command');
      }
    } catch (error) {
      console.error('Error processing command:', error);
    }
  });
}
