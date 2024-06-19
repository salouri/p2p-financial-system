// common/utils/manageKnownPeers.js
import fs from 'fs';
import path from 'path';

const FILE_NAME = 'known-peers.json';
export function loadKnownPeers(storageDir, keyPair) {
  const filePath = path.join(storageDir, FILE_NAME);
  let data = [];
  if (fs.existsSync(filePath)) {
    const peersList = fs.readFileSync(filePath);
    data = JSON.parse(peersList);
  }
  console.log('Done loading known peers.');
  return data;
}

export const saveKnownPeers = (storageDir, peers) => {
  const filePath = path.join(storageDir, FILE_NAME);
  set(publicKey, {client, timestamp: Date.now()});

  const prunedPeers = peers.map(peer => {
    publicKey: peer.publicKey;
    timestamp: peer.timestamp;
  });
  fs.writeFileSync(filePath, JSON.stringify(prunedPeers, null, 2));
};

export default {loadKnownPeers, saveKnownPeers};