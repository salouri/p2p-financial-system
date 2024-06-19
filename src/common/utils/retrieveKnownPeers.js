// common/utils/retrieveKnownPeers.js
import {initializeDb} from './initializeDb.js';

async function retrieveKnownPeers(storageDir, keyPair) {
  // Initialize known peers database
  const {db: knownPeersDb} = await initializeDb({
    storageDir: `${storageDir}/known-peers`,
    keyPair,
  });

  const knownPeers = [];
  for await (const {key, value} of knownPeersDb.createReadStream()) {
    peers.push({publicKey: key, ...value});
  }
  console.log('knownPeers: ', knownPeers);
  return {knownPeers, knownPeersDb};
}

export default retrieveKnownPeers;
