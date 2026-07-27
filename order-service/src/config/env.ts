export type AnomalyMode = 'normal' | 'error' | 'latency';

export interface Config {
  port: number;
  databaseUrl: string;
  anomalyMode: AnomalyMode;
  logstashHost?: string;
  logstashPort?: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const anomalyMode = env.ANOMALY_MODE ?? 'normal';
  if (!['normal', 'error', 'latency'].includes(anomalyMode)) {
    throw new Error('ANOMALY_MODE must be one of: normal, error, latency');
  }
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const port = Number(env.PORT ?? 8081);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port');
  return {
    port,
    databaseUrl: env.DATABASE_URL,
    anomalyMode: anomalyMode as AnomalyMode,
    logstashHost: env.LOGSTASH_HOST,
    logstashPort: env.LOGSTASH_PORT ? Number(env.LOGSTASH_PORT) : undefined
  };
}
