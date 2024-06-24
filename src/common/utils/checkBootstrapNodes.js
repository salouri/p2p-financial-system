import DHT from 'hyperdht';
import config from '../config/index.js';
export default async bootstrapNodes => {
  const dht = new DHT();
  const nodes = config.bootstrapNodes;

  try {
    await Promise.any(
      nodes.map(async node => {
        const {host, port} = node;
        await dht.ping({host, port});
        console.log(`Bootstrap node is available: ${host}:${port}`);
        return true;
      }),
    );
    await dht.destroy(); // Clean up the DHT instance
    return true;
  } catch (error) {
    console.error('No bootstrap nodes are available:', error.message);
    await dht.destroy();
    return false;
  }
}
