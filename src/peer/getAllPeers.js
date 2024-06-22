import state from '../common/state/index.js';

export default function getAllPeers() {
  const allPeers = new Set();

  for (const peer of state.connectedPeers['bidders'].values()) {
    allPeers.add(peer);
  }

  for (const peer of state.connectedPeers['sellers'].values()) {
    allPeers.add(peer);
  }

  return Array.from(allPeers);
}
