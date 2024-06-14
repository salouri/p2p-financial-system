import {startServer} from '../server-setup.js';

// Mode: 'server'
// Peer ID: 'server1' (unique identifier for the server)
const mode = 'server';
const peerId = 'server1';

const storageDir = `./transactions-core-${peerId}`;

startServer(storageDir);
