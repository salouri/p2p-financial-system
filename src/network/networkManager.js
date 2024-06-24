// network/networkManager.js
import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';
import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';
import crypto from 'crypto';
import registerPeerEvents from '../peer/registerPeerEvents.js';
import registerSocketEvents from '../server/registerSocketEvents.js';
import config from '../common/config/index.js';
import eventEmitter from '../common/events/eventEmitter.js';
import state from '../common/state/index.js';
import {loadPrevConnections} from './utils/managePrevConnections.js';
import {defineClientEndpoints} from '../server/defineEndpoints.js';

const initializeDb = async storageDir => {
  const core = new Hypercore(`${storageDir}/db/rpc-server`);
  const db = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: 'binary',
  });
  await db.ready();
  return db;
};

export const startNetwork = async (storageDir, rLine) => {
  const swarm = new Hyperswarm();

  // Initialize Hyperbee database
  const db = await initializeDb(storageDir);

  // Retrieve or generate DHT seed
  let dhtSeed = (await db.get('dht-seed'))?.value;
  if (!dhtSeed) {
    dhtSeed = crypto.randomBytes(32);
    await db.put('dht-seed', dhtSeed);
  }

  // Retrieve or generate RPC seed
  let rpcSeed = (await db.get('rpc-seed'))?.value;
  if (!rpcSeed) {
    rpcSeed = crypto.randomBytes(32);
    await db.put('rpc-seed', rpcSeed);
  }

  // Start DHT with key pair generated from the seed
  const dht = new DHT({
    keyPair: DHT.keyPair(dhtSeed),
    bootstrap: config.bootstrapNodes,
  });
  await dht.ready();

  // Start RPC with seed and DHT
  const rpc = new RPC({seed: rpcSeed, dht});

  const server = rpc.createServer();
  await server.listen();
  console.log('Server is listening...');

  const serverPublicKey = server.publicKey.toString('hex');
  console.log("Node's Public Key:", serverPublicKey);

  // Load previous peer connections from the database
  const prevPeers = await loadPrevConnections(state.db);

  if (prevPeers?.length) {
    prevPeers.forEach(peer => {
      const client = rpc.connect(Buffer.from(peer.publicKey, 'hex'));
      registerPeerEvents(client, 'bidders');
      console.log(`Reconnected to previous peer: ${peer.publicKey}`);
    });
  }

  // Handle RPC server events
  server.on('close', async () => {
    console.log('Server is closed');
    eventEmitter.emit('serverShutdown');
    for (const {client} of getAllPeers()) {
      client.destroy();
    }
    await swarm.destroy();
    console.log('All connections closed and swarm destroyed.');
    await state.db.close();
    console.log('Database closed.');
    process.exit();
  });

  // When other nodes (as bidders) connect to this current one (seller)
  server.on('connection', async rpcClient => {
    console.log('Server received a new connection');
    registerPeerEvents(rpcClient, 'bidders');
    eventEmitter.emit('peerConnected', rpcClient);
  });

  swarm.on('connection', socket => {
    console.log('Swarm: Socket connection established');

    socket.write(Buffer.from(JSON.stringify({serverPublicKey})));

    registerSocketEvents(socket);

    socket.on('data', async remoteData => {
      console.log(
        'Received data from a peer:',
        JSON.parse(remoteData.toString()),
      );
      const {serverPublicKey} = JSON.parse(remoteData.toString());

      if (serverPublicKey) {
        const client = rpc.connect(Buffer.from(serverPublicKey, 'hex'));
        registerPeerEvents(client, 'sellers');
        // Define endpoints for clients/remote communication
        await defineClientEndpoints(client, rLine);
      }
    });
  });

  const discovery = swarm.join(config.commonTopic, {
    server: true,
    client: true,
  });
  await discovery.flushed();

  return {swarm, rpc, server};
};
