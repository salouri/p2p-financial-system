import {startPeer} from './src/peer-setup.js';
import {startServer} from './src/server-setup.js';

/*
  mode: Passed as 'peer' when starting the application as a client or a 'server' for server
  peerId: Unique identifier for each peer
  serverPublicKey - Optional: Public key of the server for initial connection
*/
const [, , mode, peerId, serverPublicKey] = process.argv;

const storageDir = `./transactions-core-${peerId}`;

if (mode === 'server') {
  startServer(storageDir);
} else if (mode === 'peer') {
  startPeer(storageDir, serverPublicKey);
} else {
  console.error('Invalid mode. Use "server" or "peer".');
  process.exit(1);
}
