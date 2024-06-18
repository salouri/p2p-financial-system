import {sendPublicKeyRequest} from './peerRequestHandler.js';

export default function registerPeerEvents(client) {
  client.on('destroy', () => {
    console.log('++++ Peer Connection destroyed');
  });

  client.on('close', () => {
    console.log('++++ Peer Connection closed');
  });

  client.on('open', async () => {
    console.log('++++ Peer connection opened');
    await sendPublicKeyRequest(client);
  });
}
