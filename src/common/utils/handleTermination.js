export default function handleTermination(swarm) {
  function gracefulShutdown() {
    swarm.once('close', function () {
      process.exit();
    });
    swarm.destroy();
    setTimeout(() => process.exit(), 2000);
  }

  // Handle SIGINT (Ctrl+C)
  process.once('SIGINT', gracefulShutdown);

  // Handle SIGTERM (kill command)
  process.once('SIGTERM', gracefulShutdown);

  // Handle SIGHUP (terminal closing)
  process.once('SIGHUP', gracefulShutdown);

  // Handle SIGUSR1 and SIGUSR2 (user-defined signals)
  process.once('SIGUSR1', gracefulShutdown);
  process.once('SIGUSR2', gracefulShutdown);
}
