import startNode from '../hyperswarm-setup.js';

// Mode: 'peer'
// Peer ID: 'peer1' (unique identifier for the peer)
// initialServerPublicKey: Optional, can be null for discovery via common topic
const mode = 'peer';
const peerId = 'peer1';
const initialServerPublicKey = null; // Replace with server's public key if known

const storageDir = `./transactions-core-${peerId}`;

startNode(mode, storageDir, initialServerPublicKey);
