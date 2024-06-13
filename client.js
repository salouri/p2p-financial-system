import RPC from '@hyperswarm/rpc';
import crypto from 'crypto';
import Hyperswarm from 'hyperswarm';

async function startClient() {
  const rpc = new RPC();

  const serverPublicKey =
    'f40e8961eb7daa42593835e74b3e1935c7b8b0f032c79dc972469d1bd77eed25'; // Replace with the server public key from the server log

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

startClient().catch(console.error);
