import RPC from '@hyperswarm/rpc';
import crypto from 'crypto';
import Hyperswarm from 'hyperswarm';

// Initialize Hyperswarm instance for peer-to-peer networking
const swarm = new Hyperswarm();

// Create a topic for peer discovery
const topic = crypto.createHash('sha256').update('example-topic').digest();
console.log('Generated topic:', topic.toString('hex'));

// Join the swarm
swarm.join(topic, {
  lookup: true,
  announce: false,
});

swarm.on('connection', (socket, details) => {
  console.log('Connected to RPC server:', details);

  const rpc = new RPC(socket);

  // Call the 'ping' command on the RPC server
  rpc.request('ping', {}, (err, res) => {
    if (err) throw err;
    console.log('Response from server for ping:', res);
  });

  // Call the 'sum' command on the RPC server
  rpc.request('sum', {a: 5, b: 3}, (err, res) => {
    if (err) throw err;
    console.log('Sum result from server:', res);
  });
});

swarm.on('peer', peerInfo => {
  console.log('Discovered peer:', peerInfo);
});

console.log('RPC Client setup complete');
