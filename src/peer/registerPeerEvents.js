// peer/registerPeerEvents.js
import {sendPublicKeyRequest} from './peerRequestHandler.js';

export default function registerPeerEvents(client, connectedPeers = null) {
  client.on('open', async () => {
    console.log('Peer connection opened');
    await sendPublicKeyRequest(client);
  });

  client.on('close', () => {
    if (connectedPeers) connectedPeers.delete(client);
    console.log('Peer connection closed');
  });

  client.on('destroy', () => {
    if (connectedPeers) connectedPeers.delete(client);
    console.log('Peer connection destroyed');
  });
}
