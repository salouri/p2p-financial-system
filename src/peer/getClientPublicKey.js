function getClientPublicKey(client) {
  if (client?.publicKey) {
    // console.log('found inside client.publicKey');
    return client.publicKey.toString('hex');
  }
  if (client?._publicKey) {
    // console.log('found inside client._publicKey');
    return client._publicKey.toString('hex');
  }
  if (client?._mux?.stream?.publicKey) {
    // console.log('found inside client._mux.stream.publicKey');
    return client._mux.stream.publicKey.toString('hex');
  }
  throw new Error('Public key not found');
}

export default getClientPublicKey;
