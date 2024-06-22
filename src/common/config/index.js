import dotenv from 'dotenv';
import DHT from 'hyperdht';

dotenv.config();

const config = {
  inDevelopment: process.env.NODE_ENV === 'development',
  inProduction: process.env.NODE_ENV === 'production',
  commonTopic: Buffer.alloc(32).fill('p2p-auction'),
  bootstrapNodes: [
    {host: '127.0.0.1', port: 30001}, //  hyperdht --bootstrap --host 127.0.0.1 --port 30001
  ],
  storageDir: 'storage',
  valueEncoding: 'json',
  keyPair: {
    publicKey: Buffer.from(process.env.PUBLIC_KEY, 'hex'),
    secretKey: Buffer.from(process.env.SECRET_KEY, 'hex'),
  },
  systemEndpoints: new Set([
    'notifyPeers',
    'closeMyAuction',
    'createMyAuction',
    'sendPublicKey',
    'createAuction',
    'closeAuction',
    'placeBid',
  ]),
};

export default config;
