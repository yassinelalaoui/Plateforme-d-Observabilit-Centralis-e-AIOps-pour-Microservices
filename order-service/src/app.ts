import express from 'express';
import type { Config } from './config/env.js';
import { createOrderRepository, type OrderRepository } from './repositories/order-repository.js';
import { createOrdersHandler } from './routes/orders.js';
import { AnomalyService } from './services/anomaly-service.js';
import { OrderService } from './services/order-service.js';
import { registry } from './observability/telemetry.js';

export function createApp(config: Config, repository: OrderRepository = createOrderRepository(config.databaseUrl)) {
  const app = express();
  const orderService = new OrderService(repository);
  app.get('/health', async (_req, res) => { try { await repository.ping(); res.status(200).json({ status: 'UP' }); } catch { res.status(503).json({ status: 'DOWN' }); } });
  app.get('/ready', async (_req, res) => { try { await repository.ping(); res.status(200).json({ status: 'READY' }); } catch { res.status(503).json({ status: 'NOT_READY' }); } });
  app.get('/metrics', async (_req, res) => { res.type(registry.contentType); res.send(await registry.metrics()); });
  app.get('/orders', createOrdersHandler(orderService, new AnomalyService(config.anomalyMode)));
  return { app, repository };
}
