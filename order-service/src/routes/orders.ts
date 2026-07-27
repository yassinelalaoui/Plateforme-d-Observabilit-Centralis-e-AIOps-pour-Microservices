import { trace } from '@opentelemetry/api';
import type { Request, Response } from 'express';
import type { AnomalyService, InjectedOrderError } from '../services/anomaly-service.js';
import { DatastoreUnavailableError, OrderService } from '../services/order-service.js';
import { logger, requestCounter, requestDuration } from '../observability/telemetry.js';

export function createOrdersHandler(service: OrderService, anomaly: AnomalyService) {
  return async (_request: Request, response: Response): Promise<void> => {
    const end = requestDuration.startTimer({ service: 'order-service', method: 'GET', route: '/orders' });
    const traceId = trace.getActiveSpan()?.spanContext().traceId;
    try {
      await anomaly.apply();
      response.status(200).json(await service.getOrders());
    } catch (error) {
      if (error instanceof (await import('../services/anomaly-service.js')).InjectedOrderError) {
        response.status(500).json({ code: 'INJECTED_ORDER_ERROR', message: 'A controlled order-service error was injected.' });
      } else if (error instanceof DatastoreUnavailableError) {
        response.status(503).json({ code: 'ORDER_DATASTORE_UNAVAILABLE', message: 'Order datastore is unavailable.' });
      } else {
        response.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unexpected order-service error.' });
      }
    } finally {
      const status = String(response.statusCode);
      requestCounter.inc({ service: 'order-service', method: 'GET', route: '/orders', status });
      end();
      logger.info({ traceId, status, route: '/orders' }, 'Order request completed');
    }
  };
}
