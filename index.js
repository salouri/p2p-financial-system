import startNode from './src/hyperswarm-setup.js';

/*
  mode: Passed as 'peer' when starting the application
  peerId: Unique identifier for each peer
  serverPublicKey - Optional: Public key of the server for initial connection
*/
const [, , mode, peerId, serverPublicKey] = process.argv;
if (!peerId) {
  console.error('Error: You must provide a unique peer identifier.');
  process.exit(1);
}

const storageDir = `./transactions-core-${peerId}`;

startNode(mode, storageDir, serverPublicKey);
