import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import type { OrderRepository } from '../src/repositories/order-repository.js';
import type { Order } from '../src/models/order.js';

const sampleOrders: Order[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    userId: 'user-1',
    description: 'Observability starter order',
    amount: 49.99,
    status: 'CONFIRMED',
    createdAt: '2026-07-27T09:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    userId: 'user-1',
    description: 'Alerting extension order',
    amount: 19.50,
    status: 'PENDING',
    createdAt: '2026-07-27T10:00:00.000Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    userId: 'user-2',
    description: 'AIOps sample order',
    amount: 75.00,
    status: 'CONFIRMED',
    createdAt: '2026-07-27T11:00:00.000Z',
  },
];

function createMockRepository(overrides: Partial<OrderRepository> = {}): OrderRepository {
  return {
    findAll: vi.fn<() => Promise<Order[]>>().mockResolvedValue(sampleOrders),
    ping: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    close: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('GET /orders HTTP route', () => {
  describe('normal mode', () => {
    it('should return HTTP 200 with orders when database is available', async () => {
      const repository = createMockRepository();
      const { app } = createApp({ port: 8081, databaseUrl: 'mock://', anomalyMode: 'normal' }, repository);

      const response = await request(app).get('/orders');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orders');
      expect(response.body.orders).toHaveLength(3);
      expect(response.body.orders[0]).toMatchObject({
        id: '11111111-1111-1111-1111-111111111111',
        userId: 'user-1',
        description: 'Observability starter order',
        amount: 49.99,
        status: 'CONFIRMED',
      });
    });

    it('should return HTTP 200 with an empty array when no orders exist', async () => {
      const repository = createMockRepository({
        findAll: vi.fn<() => Promise<Order[]>>().mockResolvedValue([]),
      });
      const { app } = createApp({ port: 8081, databaseUrl: 'mock://', anomalyMode: 'normal' }, repository);

      const response = await request(app).get('/orders');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ orders: [] });
    });

    it('should return HTTP 503 when the database is unavailable', async () => {
      const repository = createMockRepository({
        findAll: vi.fn().mockRejectedValue(new Error('Connection refused')),
      });
      const { app } = createApp({ port: 8081, databaseUrl: 'mock://', anomalyMode: 'normal' }, repository);

      const response = await request(app).get('/orders');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        code: 'ORDER_DATASTORE_UNAVAILABLE',
        message: expect.any(String),
      });
    });
  });

  describe('health and readiness', () => {
    it('GET /health should return 200 when database is reachable', async () => {
      const repository = createMockRepository();
      const { app } = createApp({ port: 8081, databaseUrl: 'mock://', anomalyMode: 'normal' }, repository);

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ status: 'UP' });
    });

    it('GET /health should return 503 when database is unreachable', async () => {
      const repository = createMockRepository({
        ping: vi.fn().mockRejectedValue(new Error('Connection refused')),
      });
      const { app } = createApp({ port: 8081, databaseUrl: 'mock://', anomalyMode: 'normal' }, repository);

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({ status: 'DOWN' });
    });

    it('GET /ready should return 200 when database is reachable', async () => {
      const repository = createMockRepository();
      const { app } = createApp({ port: 8081, databaseUrl: 'mock://', anomalyMode: 'normal' }, repository);

      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ status: 'READY' });
    });

    it('GET /ready should return 503 when database is unreachable', async () => {
      const repository = createMockRepository({
        ping: vi.fn().mockRejectedValue(new Error('Connection refused')),
      });
      const { app } = createApp({ port: 8081, databaseUrl: 'mock://', anomalyMode: 'normal' }, repository);

      const response = await request(app).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({ status: 'NOT_READY' });
    });
  });

  describe('metrics', () => {
    it('GET /metrics should return Prometheus metrics', async () => {
      const repository = createMockRepository();
      const { app } = createApp({ port: 8081, databaseUrl: 'mock://', anomalyMode: 'normal' }, repository);

      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.text).toContain('http_requests_total');
    });
  });
});
