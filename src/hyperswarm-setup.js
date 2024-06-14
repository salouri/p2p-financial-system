import { createClient, createServer } from '@hyperswarm/rpc';
import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';
import DHT from 'hyperdht';
import Hyperswarm from 'hyperswarm';

async function startNode(mode, storageDir, initialServerPublicKey = null) {
  const swarm = new Hyperswarm();
  console.log('Hyperswarm instance created');

  const core = new Hypercore(storageDir, {valueEncoding: 'json'});
  console.log('Hypercore instance created with storage directory:', storageDir);
  await core.ready();

  const db = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: 'json',
  });
  console.log('Hyperbee instance created');

  console.log('Node public key:', core.key.toString('hex'));

  // Initialize Hyperswarm
  const swarm = new Hyperswarm();
  const dht = new DHT();

  // common topic for initial  discovery of peers
  const commonTopic = Buffer.alloc(32).fill('decentrapay');
  console.log('Using topic:', commonTopic.toString('hex'));

  // Initialize Hyperswarm RPC
  const rpc = new RPC(swarm);
  if (mode === 'server') {
    const discovery = swarm.join(commonTopic, {
      server: true,
      client: true,
    });
    await discovery.flushed(); // Ensure the swarm is fully flushed and ready

    const server = createServer();

    server.respond('sendTransaction', async req => {
      const {sender, receiver, amount} = req;
      const transaction = {sender, receiver, amount, timeStamp: Date.now()};
      // await bee.put(`${sender}-${Date.now()}`, transaction);
      await core.append({type: 'transaction', value: transaction});
      return {status: true, transaction};
    });

    server.respond('getTransaction', async req => {
      const {index} = req;
      const data = await core.get(index);
      return data;
    });

    swarm.on('connection', (socket, details) => {
      server.attach(socket); // Attach RPC to the socket
      console.log('Server connected to a peer');

      socket.on('close', () => {
        console.log('Connection closed');
      });

      socket.on('error', err => {
        console.error('Connection error:', err);
      });

      // Send the server's public key to the client for secure connection
      socket.write(
        JSON.stringify({publicKey: server.publicKey.toString('hex')}),
      );
    });
  } else if (mode === 'peer') {
    if (initialServerPublicKey) {
      // Direct connection using server's public key
      const specificTopic = Buffer.from(initialServerPublicKey, 'hex'); // Use server's public key for specific connection
      const specificDiscovery = swarm.join(specificTopic, { client: true });
      await specificDiscovery.flushed();
    } else {
      // Join the common topic for initial discovery
      const commonDiscovery = swarm.join(commonTopic, { client: true });
      await commonDiscovery.flushed();
    }
    const client = createClient();

    swarm.on('connection', socket => {
      client.attach(socket);
      console.log('Peer connected to the server');

      socket.on('data', (data) => {
         // Receive the server's public key for secure connection if not provided initially
         if (!initialServerPublicKey) {
        const message = JSON.parse(data.toString());
        if(message?.publicKey){
          const speceifciTopic = Buffer.from(message.publicKey, 'hex');
          const specificDiscovery = swarm.join(speceifciTopic, {client: true});
          await specificDiscovery.flushed();
          console.log('Secure connection established using specific topic.');
        }
      }
      })

      socket.on('open', async () => {
        console.log('Client connected to server');
        const sendArgs = {sender: 'Alice', receiver: 'Bob', amount: 100};
        try {
          const sendResponse = await client.request('sendTransaction', [
            sendArgs,
          ]);
          console.log('Transaction sent:', sendResponse);
        } catch (error) {
          console.error('Error sending transaction:', error);
        }

        try {
          const getResponse = await client.request('getTransaction', [
            sendArgs,
          ]);
          console.log('Transaction received:', getResponse);
        } catch (error) {
          console.error('Error getting transaction:', error);
        }
      });

      socket.on('close', () => {
        console.log('Connection closed');
      });

      socket.on('error', err => {
        console.error('Connection error:', err);
      });
    });

    await swarm.flush(); // Ensuring the client connection is fully flushed
    console.log('Client is ready and looking for servers');
  }else{
    throw new Error('Invalid mode');
  }
  console.log('Node is running');
}

export default startNode;
