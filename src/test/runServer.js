import startNode from '../hyperswarm-setup.js';

// Mode: 'server'
// Peer ID: 'server1' (unique identifier for the server)
const mode = 'server';
const peerId = '1';

const storageDir = `./transactions-core-${peerId}`;

startNode(mode, storageDir);
