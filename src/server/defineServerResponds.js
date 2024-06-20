import respondHandlers from './serverRespondHandler.js';

// Define RPC Server Responses
export default async function defineServerResponds(rpcServer, core, db) {
  rpcServer.respond('sendPublicKey', () => {
    const publicKey = rpcServer.publicKey.toString('hex');
    return respondHandlers.sendPublicKeyRespond(publicKey);
  });

  rpcServer.respond('createAuction', async req => {
    return await respondHandlers.createAuctionRespond(req, core, db);
  });

  rpcServer.respond('placeBid', async req => {
    return await respondHandlers.placeBidRespond(req, core, db);
  });

  rpcServer.respond('closeAuction', async req => {
    return await respondHandlers.closeAuctionRespond(req, core, db);
  });

  rpcServer.respond('notifyPeers', async req => {
    return await respondHandlers.notifyPeersRespond(req);
  });
}
