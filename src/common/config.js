import dotenv from 'dotenv';
import DHT from 'hyperdht';

dotenv.config();

export const commonTopic = Buffer.alloc(32).fill('decentrapay');
export const VALUE_ENCODING = 'json';
export const bootstrapNodes = [{host: '127.0.0.1', port: 30001}];
//  hyperdht --bootstrap --host 127.0.0.1 --port 30001
export const keyPair = {
  publicKey: Buffer.from(process.env.PUBLIC_KEY, 'hex'),
  secretKey: Buffer.from(process.env.SECRET_KEY, 'hex'),
};

export function generateKeyPair() {
  return DHT.keyPair();
}
