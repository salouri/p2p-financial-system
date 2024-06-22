export default (data, message) => {
  const allPeers = getAllPeers();
  notifyPeersRequest(allPeers, `${message}: ${JSON.stringify(data)}`);
};
