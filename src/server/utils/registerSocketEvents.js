export default function registerSocketEvents(socket) {
  socket.on('connect', () => {
    console.log('---- Socket Connection established');
  });

  socket.on('close', () => {
    console.log('---- Socket Connection closed');
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
