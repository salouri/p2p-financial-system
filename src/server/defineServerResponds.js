import respondHandlers from './serverRespondHandler.js';

// Define RPC Server Responses
export default async function defineServerResponds(rpcServer) {
  rpcServer.respond('sendPublicKey', () => {
    const publicKey = rpcServer.publicKey.toString('hex');
    return respondHandlers.sendPublicKeyRespond(publicKey);
  });

  rpcServer.respond('createAuction', async req => {
    return await respondHandlers.createAuctionRespond(req);
  });

  rpcServer.respond('placeBid', async req => {
    return await respondHandlers.placeBidRespond(req);
  });

  rpcServer.respond('closeAuction', async req => {
    return await respondHandlers.closeAuctionRespond(req);
  });

  rpcServer.respond('notifyPeers', async req => {
    return await respondHandlers.notifyPeersRespond(req);
  });

  rpcServer.respond('getAuction', async req =>
    respondHandlers.getAuctionRespond(req),
  );
}
