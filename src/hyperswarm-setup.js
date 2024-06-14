import RPC from '@hyperswarm/rpc';
import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';
import Hyperswarm from 'hyperswarm';

async function startNode(mode, storageDir, initialServerPublicKey = null) {
  // Set up Hyperswarm for peer-to-peer networking
  const swarm = new Hyperswarm();

  // Set up RPC for handling remote procedure calls between peers
  const rpc = new RPC();

  // Create a Hypercore instance to store transaction data
  const core = new Hypercore(storageDir);
  // Create a Hyperbee instance for key-value storage on top of Hypercore
  const bee = new Hyperbee(core, {keyEncoding: 'utf-8', valueEncoding: 'json'});

  await core.ready();
  console.log('Node public key:', core.key.toString('hex'));
  // Determine announce and lookup based on the mode and initialServerPublicKey
  const isServerNode = initialServerPublicKey ? false : true;
  // Join the Hyperswarm network using the discovery key of the Hypercore instance
  swarm.join(core.discoveryKey, {lookup: true, announce: isServerNode});
  console.log('>> Joined swarm with announce:', isServerNode);
  // Ensure the swarm is fully joined before proceeding
  await swarm.flush();
  console.log('Swarm has fully joined');
  if (isServerNode) {
    // Ensure the swarm is listening before proceeding, if it's a server node
    await swarm.listen();
    console.log('Swarm is listening for connections');
  }
  // Handle new peer connections
  swarm.on('connection', (socket, details) => {
    console.log('Node: New peer connected', details);

    rpc.handle(socket, {
      // Define the sendTransaction RPC method
      sendTransaction: async (args, cb) => {
        try {
          const {sender, receiver, amount} = JSON.parse(args.toString());
          const transaction = {sender, receiver, amount, timeStamp: Date.now()};
          await bee.put(`${sender}-${Date.now()}`, transaction);
          const responseStr = JSON.stringify({status: 'success', transaction});
          const bufferedSuccessResponse = Buffer.from(responseStr);
          cb(null, bufferedSuccessResponse);
        } catch (err) {
          cb(err);
        }
      },
      // Define the getTransaction RPC method
      getTransaction: async (args, cb) => {
        try {
          const {key} = JSON.parse(args.toString());
          const transaction = await bee.get(key);
          cb(null, Buffer.from(JSON.stringify(transaction.value)));
        } catch (err) {
          cb(err);
        }
      },
    });
  }); // swamr-on-connection

  // If acting as a peer, connect to the initial server public key if provided
  if (mode === 'peer' && initialServerPublicKey) {
    const publicKeyBuffer = Buffer.from(initialServerPublicKey, 'hex'); // Convert from hex string to buffer
    const client = rpc.connect(publicKeyBuffer); // Connect to the server

    client.on('open', async () => {
      // open: the connection to the remote peer has been successfully established and the RPC protocol is ready for communication
      console.log('Client connected to server');
    });

    client.on('close', () => {
      console.error('Client connection closed');
    });

    client.on('error', err => {
      console.error('Client encountered an error:', err);
    });

    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', async data => {
      try {
        const input = JSON.parse(data.trim());
        const {action, sender, receiver, amount, key} = input;
        if (action === 'sendTransaction') {
          const sendArgs = Buffer.from(
            JSON.stringify({sender, receiver, amount}),
          );
          console.log(
            `>> action: ${action}, sender: ${sender}, receiver: ${receiver}, amount: ${amount}, key: ${key}`,
          );
          const response = await client.request('sendTransaction', sendArgs);
          console.log('Transaction response:', JSON.parse(response.toString()));
        } else if (action === 'getTransaction') {
          const getArgs = Buffer.from(JSON.stringify({key}));
          const transactionResponse = await client.request(
            'getTransaction',
            getArgs,
          );
          console.log(
            'Transaction data:',
            JSON.parse(transactionResponse.toString()),
          );
        }
      } catch (err) {
        console.error('Error during request:', err);
      }
    });
  } // if peer && initialServerPublicKey
  console.log('Node is running');
} // startNode

export default startNode;
