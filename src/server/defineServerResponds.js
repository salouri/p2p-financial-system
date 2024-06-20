import respondHandlers from './serverRespondHandler.js';

// Define RPC Server Responses
export default async function defineServerResponds(rpcServer, core, db) {
  rpcServer.respond('sendPublicKey', () => {
    const publicKey = rpcServer.publicKey.toString('hex');
    return respondHandlers.sendPublicKeyRespond(publicKey);
  });
  rpcServer.respond('createAuction', async req =>
    respondHandlers.createAuctionRespond(req, core, db),
  );
  rpcServer.respond('placeBid', async req =>
    respondHandlers.placeBidRespond(req, core),
  );
  rpcServer.respond('closeAuction', async req =>
    respondHandlers.closeAuctionRespond(req, core),
  );
  rpcServer.respond('notifyPeers', async req =>
    respondHandlers.notifyPeersRespond(req),
  );
}
