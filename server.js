import RPC from '@hyperswarm/rpc';
import crypto from 'crypto';
import Hyperswarm from 'hyperswarm';

async function startServer() {
  const rpc = new RPC();
  const server = rpc.createServer();

  // Define RPC methods
  server.respond('ping', req => Buffer.from(JSON.stringify('pong')));
  server.respond('sum', req => {
    const {a, b} = JSON.parse(req.toString());
    const result = a + b;
    return Buffer.from(JSON.stringify(result));
  });

  await server.listen();

  console.log('Server public key:', server.publicKey.toString('hex'));

  const swarm = new Hyperswarm();

  const topic = crypto
    .createHash('sha256')
    .update('simple-peer-discovery')
    .digest();
  swarm.join(topic, {lookup: true, announce: true});

  swarm.on('connection', (socket, details) => {
    console.log('Server: New peer connected');
  });

  swarm.on('peer', peerInfo => {
    console.log('Server discovered peer:', peerInfo);
  });

  console.log('Server is running');
}

startServer().catch(console.error);
