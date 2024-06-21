import respondHandlers from './serverRespondHandler.js';

// Define RPC Server Responses
export default async function defineServerResponds(rpcServer, db, connectedPeers) {
  rpcServer.respond('sendPublicKey', () => {
    const publicKey = rpcServer.publicKey.toString('hex');
    return respondHandlers.sendPublicKeyRespond(publicKey);
  });

  rpcServer.respond('createAuction', async req => {
    return await respondHandlers.createAuctionRespond(req, db, connectedPeers);
  });

  rpcServer.respond('placeBid', async req => {
    return await respondHandlers.placeBidRespond(req, db, connectedPeers);
  });

  rpcServer.respond('closeAuction', async req => {
    return await respondHandlers.closeAuctionRespond(req, db, connectedPeers);
  });

  rpcServer.respond('notifyPeers', async req => {
    return await respondHandlers.notifyPeersRespond(req);
  });
}
