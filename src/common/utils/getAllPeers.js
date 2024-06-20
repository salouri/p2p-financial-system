export default function getAllPeers(connectedPeers) {
  const allPeers = new Set();

  for (const peer of connectedPeers['bidders'].values()) {
    allPeers.add(peer);
  }

  for (const peer of connectedPeers['sellers'].values()) {
    allPeers.add(peer);
  }

  return Array.from(allPeers);
}
