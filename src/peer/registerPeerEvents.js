// peer/registerPeerEvents.js
import getClientPublicKey from './getClientPublicKey.js';
export default function registerPeerEvents(client, connectedPeers) {
  const publicKey = getClientPublicKey(client);

  client.on('open', async () => {
    console.log('Peer connection opened');
    connectedPeers.set(publicKey, {client, timestamp: Date.now()});
  });

  client.on('close', () => {
    connectedPeers.delete(publicKey);
    console.log('Peer connection closed');
  });

  client.on('destroy', () => {
    connectedPeers.delete(publicKey);
    console.log('Peer connection destroyed');
  });
}
