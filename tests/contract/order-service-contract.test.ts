/**
 * Contract tests for Order Service GET /orders.
 * Validates response structure against order-service.openapi.yaml.
 *
 * These tests use the Express app with a mocked repository to validate
 * that the HTTP contract is upheld without requiring a running database.
 */
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../order-service/src/app.js';
import type { OrderRepository } from '../../order-service/src/repositories/order-repository.js';
import type { Order } from '../../order-service/src/models/order.js';

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
];

function createMockRepository(overrides: Partial<OrderRepository> = {}): OrderRepository {
  return {
    findAll: vi.fn<() => Promise<Order[]>>().mockResolvedValue(sampleOrders),
    ping: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    close: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('Order Service Contract: GET /orders', () => {
  describe('HTTP 200 — successful response', () => {
    it('should return Content-Type application/json', async () => {
      const { app } = createApp({ port: 8081, databaseUrl: 'mock://', anomalyMode: 'normal' }, createMockRepository());
      const response = await request(app).get('/orders');
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return a root object with an "orders" array', async () => {
      const { app } = createApp({ port: 8081, databaseUrl: 'mock://', anomalyMode: 'normal' }, createMockRepository());
      const response = await request(app).get('/orders');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orders');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('should have all required Order fields per the OpenAPI contract', async () => {
      const { app } = createApp({ port: 8081, databaseUrl: 'mock://', anomalyMode: 'normal' }, createMockRepository());
      const response = await request(app).get('/orders');

      for (const order of response.body.orders) {
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('userId');
        expect(order).toHaveProperty('description');
        expect(order).toHaveProperty('amount');
        expect(order).toHaveProperty('status');
        expect(order).toHaveProperty('createdAt');

        // Type assertions
        expect(typeof order.id).toBe('string');
        expect(typeof order.userId).toBe('string');
        expect(typeof order.description).toBe('string');
        expect(typeof order.amount).toBe('number');
        expect(order.amount).toBeGreaterThanOrEqual(0);
        expect(['PENDING', 'CONFIRMED', 'CANCELLED']).toContain(order.status);
        expect(typeof order.createdAt).toBe('string');
        // Verify ISO 8601 date-time format
        expect(new Date(order.createdAt).toISOString()).toBe(order.createdAt);
      }
    });

    it('should return an empty orders array when no orders exist', async () => {
      const { app } = createApp(
        { port: 8081, databaseUrl: 'mock://', anomalyMode: 'normal' },
        createMockRepository({ findAll: vi.fn<() => Promise<Order[]>>().mockResolvedValue([]) }),
      );
      const response = await request(app).get('/orders');

      expect(response.status).toBe(200);
      expect(response.body.orders).toEqual([]);
    });
  });

  describe('HTTP 503 — datastore unavailable', () => {
    it('should return 503 with code and message when database fails', async () => {
      const { app } = createApp(
        { port: 8081, databaseUrl: 'mock://', anomalyMode: 'normal' },
        createMockRepository({ findAll: vi.fn().mockRejectedValue(new Error('Connection refused')) }),
      );
      const response = await request(app).get('/orders');

      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.code).toBe('string');
      expect(typeof response.body.message).toBe('string');
    });
  });
});
