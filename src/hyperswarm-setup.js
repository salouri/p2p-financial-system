import crypto from 'crypto';
import Hypercore from 'hypercore';
import Hyperswarm from 'hyperswarm';

// Initialize Hyperswarm instance for peer-to-peer networking
const swarm = new Hyperswarm();

// Create a Hypercore instance for data storage
const feed = new Hypercore('./storage', {
  valueEncoding: 'json', // Other possible values: 'utf-8', 'binary', 'hex', 'base64'
});

// Function to set up RPC handlers
const setupRPC = rpc => {
  // Example handler for a simple "ping" RPC call
  rpc.command('ping', (args, cb) => {
    cb(null, 'pong');
  });
};

feed.ready(() => {
  // Generate a topic for peer discovery
  const hash = crypto.createHash('sha256'); // Create a SHA-256 hash object
  hash.update('example-topic'); // Add data to the hash

  const topic = hash.digest(); // Finalize the hash and get the result as a Buffer

  swarm.join(topic, {
    lookup: true, // Find & connect to peers
    announce: true, // Announce self as a connection target
  });

  swarm.on('connection', (socket, details) => {
    // socket: Duplex stream
    // details: Object that contains connection-specific metadata.
    console.log('New peer connected');

    // Set up a two-way data replication stream between connected peers
    socket.pipe(feed.replicate()).pipe(socket);

    // set up RPC over the connection
    const rpc = new RPC(socket);
    setupRPC(rpc);
  }); // swarm.on-connection
  console.log('Swarm and feed setup complete');
});

export default swarm;
