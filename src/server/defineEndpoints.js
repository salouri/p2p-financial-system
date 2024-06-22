import respondHandlers from './serverRespondHandler.js';
import requestHandlers from '../peer/peerRequestHandler.js';
import getAllPeers from '../peer/getAllPeers.js';
import eventEmitter from '../common/events/eventEmitter.js';
import state from '../common/state/index.js';

export async function defineLocalEndpoints(rline) {
  rline.on('line', async input => {
    const [command, ...jsonData] = input.split(' ');
    try {
      let data = {};
      if (jsonData.length > 0) {
        const dataStr = jsonData.join(' ');
        data = JSON.parse(
          dataStr.replace(/([a-zA-Z0-9_]+?):/g, '"$1":').replace(/'/g, '"'),
        );
      }
      switch (command) {
        case 'createAuction-local':
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

        case 'closeAuction-local':
          const {localAuctionId} = data;
          const localCloseAucRes = await respondHandlers.closeAuctionRespond(
            Buffer.from(JSON.stringify({auctionId: localAuctionId})),
          );
          console.log('Local Auction Closed:', localCloseAucRes.toString());
          break;

        default:
          console.log('Unknown command');
      }
    } catch (error) {
      console.error('Error processing command:', error);
    }
  });
}

export async function defineServerEndpoints(rline, client) {
  rline.on('line', async input => {
    const [command, ...jsonData] = input.split(' ');
    try {
      let data = {};
      if (jsonData.length > 0) {
        const dataStr = jsonData.join(' ');
        data = JSON.parse(
          dataStr.replace(/([a-zA-Z0-9_]+?):/g, '"$1":').replace(/'/g, '"'),
        );
      }
      const message = data?.message || 'Broadcast message to all peers';

      switch (command) {
        case 'sendPublicKey':
          await requestHandlers.sendPublicKeyRequest(client);
          break;

        case 'notifyPeers':
          const allPeers = getAllPeers();
          await requestHandlers.notifyPeersRequest(allPeers, message);
          break;

        case 'notifyMyPeers':
          eventEmitter.emit('notifyPeers', message);
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

        case 'placeBid':
          const {auctionId, bidderId, amount} = data;
          const bidResponse = await requestHandlers.placeBidRequest(
            client,
            auctionId,
            bidderId,
            parseFloat(amount),
          );
          console.log('Bid Placed:', JSON.parse(bidResponse.toString()));
          break;

        case 'closeAuction':
          const {auctionId: auctionToCloseId} = data;
          const closeAuctionResponse =
            await requestHandlers.closeAuctionRequest(client, auctionToCloseId);
          console.log('Auction Closed:', closeAuctionResponse);
          break;

        case 'closeMyAuction':
          const {localAuctionId} = data;
          const localCloseAucRes = await respondHandlers.closeAuctionRespond(
            Buffer.from(JSON.stringify({auctionId: localAuctionId})),
          );
          console.log('Local Auction Closed:', localCloseAucRes.toString());
          break;

        default:
          console.log('Unknown command');
      }
    } catch (error) {
      console.error('Error processing command:', error);
    }
  });
}
