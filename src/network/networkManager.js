// network/networkManager.js
import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';
import registerPeerEvents from '../peer/registerPeerEvents.js';
import registerSocketEvents from '../server/registerSocketEvents.js';
import config from '../common/config/index.js';
import eventEmitter from '../common/events/eventEmitter.js';
import state from '../common/state/index.js';
import {loadKnownPeers, saveKnownPeers} from './utils/manageKnownPeers.js';
import {defineClientEndpoints} from '../server/defineEndpoints.js';

export const startNetwork = async (storageDir, rLine) => {
  const swarm = new Hyperswarm();
  const keyPair = DHT.keyPair();
  const dht = new DHT({keyPair, bootstrap: config.bootstrapNodes});
  await dht.ready();

  const rpc = new RPC({dht});

  const server = rpc.createServer();
  await server.listen();
  console.log('Server is listening...');

  const serverPublicKey = server.publicKey.toString('hex');
  console.log("Node's Public Key:", serverPublicKey);

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
