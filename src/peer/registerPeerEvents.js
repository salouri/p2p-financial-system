// peer/registerPeerEvents.js
import getClientPublicKey from './getClientPublicKey.js';
export default function registerPeerEvents(client, connectedPeers, nodeType) {
  const publicKey = getClientPublicKey(client, nodeType);

  client.on('open', async () => {
    const clientType = nodeType.substring(0, nodeType.length - 1);
    console.log(`${clientType} peer connection opened`);
    console.log(
      `adding ${clientType} client to connectedPeers: ${String(
        publicKey,
      ).substring(0, 15)}...`,
    );
    connectedPeers[nodeType].set(publicKey, {client, timestamp: Date.now()});
  });

  client.on('close', () => {
    connectedPeers[nodeType].delete(publicKey);
    console.log('Peer connection closed');
  });

  client.on('destroy', () => {
    connectedPeers[nodeType].delete(publicKey);
    console.log('Peer connection destroyed');
  });
}
