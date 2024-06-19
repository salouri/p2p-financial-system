function getClientPublicKey(client, nodeType) {
  if (nodeType === 'senders' && client?._mux?.stream?.remotePublicKey) {
    return client?._mux?.stream?.remotePublicKey.toString('hex');
  } else if (nodeType === 'receivers') {
    if (client?._publicKey) {
      return client._publicKey.toString('hex');
    }
    if (client?._mux?.stream?.publicKey) {
      return client._mux.stream.publicKey.toString('hex');
    }
    throw new Error('Public key not found');
  } else {
    throw new Error(
      'Uknown node type! Types used are "senders" or "receivers"',
    );
  }
}

export default getClientPublicKey;
