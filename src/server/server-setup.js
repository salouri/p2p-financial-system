import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';
import {bootstrapNodes, commonTopic, keyPair} from '../common/config.js';
import handleTermination from '../common/utils/handleTermination.js';
import serverRespondHandler from './serverRespondHandler.js';
import {createCoreAndBee} from './utils/createCoreAndBee.js';
import registerSocketEvents from './utils/registerSocketEvents.js';

const connectedPeers = new Set();

export async function startServer(storageDir) {
  const swarm = new Hyperswarm();

  const {core} = await createCoreAndBee(storageDir, 'json');

  const dht = new DHT({port: 40001, keyPair, bootstrap: bootstrapNodes});
  await dht.ready();

  const rpc = new RPC({dht, keyPair}); // can take {dht, keyPair}

  const server = rpc.createServer();
  await server.listen();

  const serverPublicKey = server.publicKey.toString('hex');

  console.log('Server Public Key:', serverPublicKey);

  // ############## Define Server Events ##############
  server.on('listening', () => {
    console.log('Server is listening...');
  });
  server.on('close', () => {
    console.log('***** Server is closed');

    for (const connection of connectedPeers) {
      connection.write(
        Buffer.from(JSON.stringify({message: 'Server is shutting down.'})),
      );
      connection.destroy();
    }
    swarm.destroy();
    console.log('***** All connections closed and swarm destroyed.');
    process.exit();
  });

  server.on('connection', rpcClient => {
    console.log('**** Server got a new connection');

    connectedPeers.add(rpcClient);
    console.log('Connected RPC clients:', connectedPeers.size);

    rpcClient.on('close', () => {
      console.log('#### RPC connection closed');
      const peerPublicKeyStr = rpcClient?.remotePublicKey?.toString('hex');
      connectedPeers.delete(rpcClient);

      if (peerPublicKeyStr)
        console.log(
          `#### connection removed: ${peerPublicKeyStr?.substring(0, 15)}...`,
        );
      console.log('#### Connected RPC clients:', connectedPeers.size);
    });

    rpcClient.on('destroy', () => {
      console.log('#### Server is destroyed');
    });
  }); // server-connection

  // ############## Define Server Responces ##############
  server.respond('sendPublicKey', () => {
    return serverRespondHandler.sendPublicKey(serverPublicKey);
  });

  server.respond('sendTransaction', async req => {
    return await serverRespondHandler.sendTransaction(req, core);
  });

  server.respond('getTransaction', async req => {
    return await serverRespondHandler.getTransaction(req, core);
  });

  swarm.on('connection', (socket, info) => {
    console.log('>>>> swarm: got a new connection.');

    console.log(
      '>>>> remotePublicKey:',
      socket.remotePublicKey.toString('hex'),
    );
    console.log('     publicKey:', socket.publicKey.toString('hex'));
    socket.write(
      Buffer.from(
        JSON.stringify({serverPublicKey: server.publicKey.toString('hex')}),
      ),
    );

    registerSocketEvents(socket);

    const peerRpc = rpc.connect(socket.publicKey);

    peerRpc.on('open', () => {
      console.log('++++ Peer  connection opened');
    });

    peerRpc.on('close', () => {
      console.log('++++ Peer  connection closed');
    });

    peerRpc.on('destroy', () => {
      console.log('++++ Peer  connection destroyed:');
    });
  });

  //   const discovery = swarm.join(commonTopic, {keyPair});
  const discovery = swarm.join(commonTopic, {server: true, client: true});
  await discovery.flushed(); // once resolved, it means topic is joined

  console.log('Server is running');

  handleTermination(swarm);
}
