import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import pino from 'pino';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });
export const requestCounter = new Counter({ name: 'http_requests_total', help: 'HTTP requests', labelNames: ['service', 'method', 'route', 'status'] as const, registers: [registry] });
export const requestDuration = new Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration', labelNames: ['service', 'method', 'route'] as const, registers: [registry] });
export const mlAnomalyScore = new Gauge({ name: 'ml_anomaly_score', help: 'ML Anomaly Score', registers: [registry] });
export const logger = pino({ base: { service: 'order-service' }, redact: ['password', 'authorization', 'cookie'] });

export function startTelemetry(): NodeSDK {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'order-service' }),
    traceExporter: endpoint ? new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }) : undefined
  });
  sdk.start();
  return sdk;
}
