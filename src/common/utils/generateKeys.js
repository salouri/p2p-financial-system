import DHT from 'hyperdht';

export function generateKeys() {
  const keys = DHT.keyPair();
  const publicKey = keys.publicKey.toString('hex');
  const secretKey = keys.secretKey.toString('hex');
  return {publicKey, secretKey};
}
