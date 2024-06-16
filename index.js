import {startPeer} from './src/peer/peer-setup.js';
import {startServer} from './src/server/server-setup.js';

/*
  mode: Passed as 'peer' when starting the application as a client or a 'server' for server
  peerId: Unique identifier for each peer
  serverPublicKey - Optional: Public key of the server for initial connection
*/
const [, , mode, id, serverPublicKey] = process.argv;

let storageDir = './storage';

if (mode === 'server') {
  storageDir += `/server-${id}`;
  startServer(storageDir);
} else if (mode === 'peer') {
  storageDir += `/peer-${id}`;
  startPeer(storageDir, serverPublicKey);
} else {
  console.error('Invalid mode. Use "server" or "peer".');
  process.exit(1);
}
