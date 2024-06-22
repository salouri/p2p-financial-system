// peer/registerPeerEvents.js
import getClientPublicKey from './getClientPublicKey.js';
import state from '../common/state/index.js';

export default function registerPeerEvents(client, nodeType) {
  const publicKey = getClientPublicKey(client, nodeType);

  client.on('open', async () => {
    const clientType = nodeType.substring(0, nodeType.length - 1);
    console.log(`${clientType} peer connection opened`);
    console.log(
      `adding ${clientType} peer to connectedPeers: ${String(
        publicKey,
      ).substring(0, 15)}...`,
    );
    state.connectedPeers[nodeType].set(publicKey, {
      client,
      timestamp: Date.now(),
    });
  });

  client.on('close', () => {
    state.connectedPeers[nodeType].delete(publicKey);
    console.log('Peer connection closed');
  });

  client.on('destroy', () => {
    state.connectedPeers[nodeType].delete(publicKey);
    console.log('Peer connection destroyed');
  });
}
