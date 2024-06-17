export default function registerSocketEvents(socket, conns) {
  socket.on('connect', () => {
    console.log('---- Socket Connection established');
  });

  socket.on('close', () => {
    console.log('---- Socket Connection closed');
    delete conns[peerPublicKeyStr];
    console.log(
      `---- connection removed: ${peerPublicKeyStr.substring(0, 10)}...`,
    );
    console.log('---- total connections remain:', Object.keys(conns).length);
  });

  socket.on('data', data => {
    console.log('---- Received data:', data.toString());
  });

  socket.on('error', err => {
    console.error('---- Socket Connection error:', err);
  });

  socket.on('end', err => {
    console.error('---- Socket Connection ended:', err);
  });
}
