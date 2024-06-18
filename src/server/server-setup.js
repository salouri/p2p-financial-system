import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';
import {
  bootstrapNodes,
  commonTopic,
  generateKeyPair,
} from '../common/config.js';
import handleTermination from '../common/utils/handleTermination.js';
import {
  getTransactionRespond,
  sendPublicKeyRespond,
  sendTransactionRespond,
} from './serverRespondHandler.js';
import {createCoreAndBee} from './utils/createCoreAndBee.js';
import registerSocketEvents from './utils/registerSocketEvents.js';

const connectedPeers = new Set();

export async function startServer(storageDir) {
  const swarm = new Hyperswarm();

  const {core, db} = await createCoreAndBee(storageDir, 'json');

  const keyPair = generateKeyPair();
  const dht = new DHT({keyPair, bootstrap: bootstrapNodes});
  await dht.ready();

  const rpc = new RPC({dht, keyPair});

  const server = rpc.createServer();
  await server.listen();

  const serverPublicKey = server.publicKey.toString('hex');
  console.log('Server Public Key:', serverPublicKey);

  // Define Server Events
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
  });

  // Define Server Responses
  server.respond('sendPublicKey', () => {
    const response = sendPublicKeyRespond(serverPublicKey);
    return Buffer.from(JSON.stringify(response));
  });

  server.respond('sendTransaction', async req => {
    const response = await sendTransactionRespond(req, core);
    if (response.status) {
      const dbRes = await db.put(
        response.transaction.timeStamp,
        response.transaction,
      );
    }
    return Buffer.from(JSON.stringify(response));
  });

  server.respond('getTransaction', async req => {
    const response = await getTransactionRespond(req, core);
    return Buffer.from(JSON.stringify(response));
  });

  swarm.on('connection', (socket, info) => {
    console.log('Swarm: got a new connection.');
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

  const discovery = swarm.join(commonTopic, {server: true, client: true});
  await discovery.flushed(); // once resolved, it means topic is joined

  console.log('Server is running');

  handleTermination(swarm);
}
