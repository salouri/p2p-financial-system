export default function registerPeerEvents(client) {
  client.on('destroy', () => {
    console.log('RPC Connection destroyed');
  });

  client.on('close', () => {
    console.log('RPC Connection closed');
  });

  client.on('open', async () => {
    console.log('Peer connection opened');

    try {
      console.log('Requesting Server-Public-Key...');
      const sendPublicKeyRes = await client.request(
        'sendPublicKey',
        Buffer.alloc(0),
      );
      const parsedRes = JSON.parse(sendPublicKeyRes.toString());
      console.log('sendPublicKeyRes: ', parsedRes);
      const {publicKey} = parsedRes;
    } catch (error) {
      console.error('Error receiving server public key:', error);
    }
  });
}
