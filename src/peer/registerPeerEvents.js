// peer/registerPeerEvents.js
import getClientPublicKey from './getClientPublicKey.js';
import state from '../common/state/index.js';

export default function registerPeerEvents(client) {
  const publicKey = getClientPublicKey(client);

  client.on('open', async () => {
    if (publicKey) {
      console.log(`New peer connection opened`);
      console.log(
        `Connected Peer\'s Public Key: ${publicKey?.substring(0, 15)}...`,
      );
      state.connectedPeers.set(publicKey, {
        client,
        timestamp: Date.now(),
      });
    }
  });

  client.on('close', () => {
    state.connectedPeers.delete(publicKey);
    console.log('Peer connection closed');
  });

  client.on('destroy', () => {
    state.connectedPeers.delete(publicKey);
    console.log('Peer connection destroyed');
  });
}
