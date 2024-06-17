import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';
import {bootstrapNodes, commonTopic, keyPair} from '../common/config.js';
import handleTermination from '../common/utils/handleTermination.js';
import serverRespondHandler from './serverRespondHandler.js';
import {createCoreAndBee} from './utils/createCoreAndBee.js';
import registerSocketEvents from './utils/registerSocketEvents.js';
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
    Object.values(conns).forEach(conn => {
      conn.destroy();
    });
  });
  server.on('connection', rpcClient => {
    console.log('**** Server got a connection');

    rpcClient.on('close', () => {
      console.log('#### Server is closed');

      const peerPublicKeyStr = rpcClient.remotePublicKey.toString('hex');
      delete conns[peerPublicKeyStr];
      console.log(
        `#### connection removed: ${peerPublicKeyStr.substring(0, 10)}...`,
      );
      console.log('#### total connections remain:', Object.keys(conns).length);
    });

    rpcClient.on('destroy', () => {
      console.log('#### Server is destroyed');
    });
  }); // server-connection

  // ############## Define Server Responces ##############
  server.respond('sendPublicKey', serverPublicKey =>
    serverRespondHandler.sendPublicKey(serverPublicKey),
  );

  server.respond('sendTransaction', async req => {
    return await serverRespondHandler.sendTransaction(req, core);
  });

  server.respond('getTransaction', async req => {
    return await serverRespondHandler.getTransaction(req, core);
  });

  const conns = {};
  swarm.on('connection', (socket, info) => {
    console.log('>>>> swarm: got a new connection.');

    console.log(
      '>>>> remotePublicKey:',
      socket.remotePublicKey.toString('hex'),
    );
    console.log('>>>> publicKey:', socket.publicKey.toString('hex'));
    socket.write(
      Buffer.from(
        JSON.stringify({serverPublicKey: server.publicKey.toString('hex')}),
      ),
    );

    const peerPublicKeyStr = socket.remotePublicKey.toString('hex');
    conns[peerPublicKeyStr] = socket;
    console.log('>>>> total connections:', Object.keys(conns).length);

    registerSocketEvents(socket, conns);

    const peerRpc = rpc.connect(socket.publicKey);

    peerRpc.on('open', () => {
      console.log('++++ Server-side RPC connection opened');
    });

    peerRpc.on('close', () => {
      console.log('++++ Server-side RPC connection closed');
    });

    peerRpc.on('destroy', err => {
      console.log('++++ Server-side RPC connection destroyed:', err);
    });
  });

  //   const discovery = swarm.join(commonTopic, {keyPair});
  const discovery = swarm.join(commonTopic, {server: true, client: true});
  await discovery.flushed(); // once resolved, it means topic is joined

  console.log('Server is running');

  handleTermination(swarm);
}
