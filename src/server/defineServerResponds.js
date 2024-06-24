import respondHandlers from './serverRespondHandler.js';

// Define RPC Server Responses
export default async function defineServerResponds(rpcServer) {
  rpcServer.respond('sendPublicKey', () => {
    const publicKey = rpcServer.publicKey.toString('hex');
    return respondHandlers.sendPublicKeyRespond(publicKey);
  });

  rpcServer.respond('sendTransaction', async req => {
    return await respondHandlers.sendTransactionRespond(req);
  });

  rpcServer.respond('notifyPeers', async req => {
    return await respondHandlers.notifyPeersRespond(req);
  });

  rpcServer.respond(
    'getTransaction',
    async req => await respondHandlers.getTransactionRespond(req),
  );
}
