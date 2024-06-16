export function registerRpcEvents(rpc) {
  rpc.on('error', err => {
    console.error('RPC Error:', err);
  });
  rpc.on('close', () => {
    console.log('RPC Connection closed');
  });
}
