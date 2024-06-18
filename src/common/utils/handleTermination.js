export default async function handleTermination(swarm, core, db) {
  async function gracefulShutdown() {
    try {
      if (core) await core.close();
      if (db) await db.close();
    } catch (error) {
      console.error('Error closing core or db:', error);
    }

    // on
    swarm.once('close', function () {
      process.exit();
    });

    swarm.destroy();

    // Ensure exit if swarm doesn't close in time
    setTimeout(() => process.exit(), 1000);
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
