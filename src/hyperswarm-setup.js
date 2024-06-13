import Hyperswarm from 'hyperswarm';
import crypto from 'crypto';
import RPC from '@hyperswarm/rpc';

async function startServer() {
  const rpc = new RPC();
  const server = rpc.createServer();

  // Define RPC methods
  server.respond('ping', () => Buffer.from(JSON.stringify('pong')));
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

async function startClient(serverPublicKey) {
  const rpc = new RPC();

  const client = rpc.connect(Buffer.from(serverPublicKey, 'hex'));

  client.on('open', async () => {
    try {
      const responsePing = await client.request(
        'ping',
        Buffer.from(JSON.stringify({})),
      );
      console.log(
        'Response from server for ping:',
        JSON.parse(responsePing.toString()),
      );

      const responseSum = await client.request(
        'sum',
        Buffer.from(JSON.stringify({a: 5, b: 3})),
      );
      console.log(
        'Sum result from server:',
        JSON.parse(responseSum.toString()),
      );
    } catch (err) {
      console.error('Error during request:', err);
    }
  });

  client.on('close', () => {
    console.log('Client connection closed');
  });

  client.on('error', err => {
    console.error('Client connection error:', err);
  });

  const swarm = new Hyperswarm();

  const topic = crypto
    .createHash('sha256')
    .update('simple-peer-discovery')
    .digest();
  swarm.join(topic, {lookup: true, announce: false});

  swarm.on('connection', (socket, details) => {
    console.log('Client: Connected to server');
  });

  swarm.on('peer', peerInfo => {
    console.log('Client discovered peer:', peerInfo);
  });

  console.log('Client is running');
}

export default startServer;
export {startClient};
