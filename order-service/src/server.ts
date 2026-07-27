import { loadConfig } from './config/env.js';
import { createApp } from './app.js';
import { logger, startTelemetry } from './observability/telemetry.js';

const config = loadConfig();
const telemetry = startTelemetry();
const { app, repository } = createApp(config);
const server = app.listen(config.port, () => logger.info({ port: config.port, anomalyMode: config.anomalyMode }, 'Order Service started'));

async function shutdown(signal: string) {
  logger.info({ signal }, 'Order Service shutting down');
  server.close(async () => { await repository.close(); await telemetry.shutdown(); process.exit(0); });
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
