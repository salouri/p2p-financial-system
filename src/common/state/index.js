// Global state module

class State {
  constructor() {
    this._connectedPeers = new Map();
    this._db = null;
  }

  // Getters
  get connectedPeers() {
    return this._connectedPeers;
  }

  get db() {
    return this._db;
  }

  // Setters
  set connectedPeers(peers) {
    this._connectedPeers = peers;
  }

  set db(database) {
    this._db = database;
  }
}

const state = new State();
export default state;
