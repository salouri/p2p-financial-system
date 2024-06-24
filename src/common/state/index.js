// Global state module

class State {
  constructor() {
    this._connectedPeers = {
      bidders: new Map(),
      sellers: new Map(),
    };
    this._activeAuctions = new Map();
    this._db = null;
  }

  // Getters
  get connectedPeers() {
    return this._connectedPeers;
  }

  get activeAuctions() {
    return this._activeAuctions;
  }

  get db() {
    return this._db;
  }

  // Setters
  set connectedPeers(peers) {
    this._connectedPeers = peers;
  }

  set activeAuctions(auctions) {
    this._activeAuctions = auctions;
  }

  set db(database) {
    this._db = database;
  }
}

const state = new State();
export default state;
