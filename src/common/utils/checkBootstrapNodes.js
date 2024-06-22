import DHT from 'hyperdht';
import config from '../config/index.js';
export default async bootstrapNodes => {
  const dht = new DHT();
  const result = config.bootstrapNodes.some(async node => {
    try {
      const {host, port} = node;
      await dht.ping({host, port});
      console.log(`Bootstrap node is available: ${host}:${port}`);
      dht.destroy(); // Clean up the DHT instance
      return true;
    } catch (error) {
      console.error(`Error checking bootstrap node at ${host}:${port}:`, error);
      return false;
    }
  });
  dht.destroy();
  return result;
};
