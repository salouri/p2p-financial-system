import respondHandlers from './serverRespondHandler.js';
import requestHandlers from '../peer/peerRequestHandler.js';
import getAllPeers from '../peer/getAllPeers.js';
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
        data = JSON.parse(dataStr);
      }
      const message = data?.message || 'Broadcast message to all peers';
      const auctionId = data?.AuctionId || '';

      switch (command) {
        case 'createMyAuction':
          const {localSellerId, localItem} = data;
          const auctionBuffer = Buffer.from(
            JSON.stringify({sellerId: localSellerId, item: localItem}),
          );
          const localAuctRes = await respondHandlers.createAuctionRespond(
            auctionBuffer,
          );
          console.log(
            'Local Auction Created:',
            JSON.parse(localAuctRes.toString()),
          );
          break;

        case 'getMyAuction':
          const localAuctionRes = await respondHandlers.getAuctionRespond(
            Buffer.from(JSON.stringify({auctionId})),
          );
          console.log(
            'Auction Details:',
            JSON.parse(localAuctionRes.toString()),
          );
          break;

        case 'closeMyAuction':
          const localCloseAucRes = await respondHandlers.closeAuctionRespond(
            Buffer.from(JSON.stringify({auctionId})),
          );
          console.log(
            'Auction Closed:',
            JSON.parse(localCloseAucRes.toString()),
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
      const auctionId = data?.AuctionId || '';

      if (state.connectedPeers.sellers.size === 0) {
        console.log('No clients connected. Unable to execute this command.');
        return;
      }

      switch (command) {
        case 'sendPublicKey':
          await requestHandlers.sendPublicKeyRequest(client);
          break;

        case 'createAuction':
          const {sellerId, item} = data;
          const auctionResponse = await requestHandlers.createAuctionRequest(
            client,
            sellerId,
            item,
          );
          console.log('Auction Created:', auctionResponse);
          break;

        case 'getAuction':
          const auctionRes = await requestHandlers.getAuctionRequest(
            client,
            auctionId,
          );
          console.log('Auction Details:', JSON.parse(auctionRes.toString()));
          break;

        case 'placeBid':
          const {bidderId, amount} = data;
          const bidResponse = await requestHandlers.placeBidRequest(
            client,
            auctionId,
            bidderId,
            parseFloat(amount),
          );
          console.log('Bid Placed:', bidResponse);
          break;

        case 'closeAuction':
          const closeAuctionResponse =
            await requestHandlers.closeAuctionRequest(client, auctionId);
          console.log('Auction Closed:', closeAuctionResponse);
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
