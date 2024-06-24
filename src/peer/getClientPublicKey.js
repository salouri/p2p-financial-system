function getClientPublicKey(client) {
  if (client?._publicKey) {
    return client._publicKey.toString('hex');
  } else {
    return null;
  }
}

export default getClientPublicKey;
