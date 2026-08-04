import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrderRepository, type OrderRepository } from '../src/repositories/order-repository.js';

// Mock the 'pg' module so we never touch a real database
vi.mock('pg', () => {
  const mockQuery = vi.fn();
  const mockEnd = vi.fn();
  class MockPool {
    query: any;
    end: any;
    constructor() {
      this.query = mockQuery;
      this.end = mockEnd;
    }
  }
  return {
    Pool: MockPool,
    __mockQuery: mockQuery,
    __mockEnd: mockEnd,
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockQuery: ReturnType<typeof vi.fn>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockEnd: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.clearAllMocks();
  // Re-import the mocks after clearing
  const pg = await import('pg');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockQuery = (pg as any).__mockQuery;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockEnd = (pg as any).__mockEnd;
});

describe('OrderRepository', () => {
  let repository: OrderRepository;

  beforeEach(() => {
    repository = createOrderRepository('postgresql://test:test@localhost:5432/testdb');
  });

  describe('findAll', () => {
    it('should return seeded orders mapped to the domain model', async () => {
      const seededRows = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          user_id: 'user-1',
          description: 'Observability starter order',
          amount: '49.99',
          status: 'CONFIRMED',
          created_at: new Date('2026-07-27T09:00:00Z'),
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          user_id: 'user-1',
          description: 'Alerting extension order',
          amount: '19.50',
          status: 'PENDING',
          created_at: new Date('2026-07-27T10:00:00Z'),
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          user_id: 'user-2',
          description: 'AIOps sample order',
          amount: '75.00',
          status: 'CONFIRMED',
          created_at: new Date('2026-07-27T11:00:00Z'),
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: seededRows });

      const orders = await repository.findAll();

      expect(orders).toHaveLength(3);
      expect(orders[0]).toEqual({
        id: '11111111-1111-1111-1111-111111111111',
        userId: 'user-1',
        description: 'Observability starter order',
        amount: 49.99,
        status: 'CONFIRMED',
        createdAt: '2026-07-27T09:00:00.000Z',
      });
      expect(orders[1].userId).toBe('user-1');
      expect(orders[2].userId).toBe('user-2');
      expect(orders[2].amount).toBe(75.0);
    });

    it('should return an empty array when no orders exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const orders = await repository.findAll();

      expect(orders).toEqual([]);
    });

    it('should throw when the datastore is unavailable', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(repository.findAll()).rejects.toThrow('Connection refused');
    });
  });

  describe('ping', () => {
    it('should resolve when the database is reachable', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      await expect(repository.ping()).resolves.toBeUndefined();
      expect(mockQuery).toHaveBeenCalledWith('SELECT 1');
    });

    it('should reject when the database is unreachable', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(repository.ping()).rejects.toThrow('Connection refused');
    });
  });

  describe('close', () => {
    it('should close the connection pool', async () => {
      mockEnd.mockResolvedValueOnce(undefined);

      await expect(repository.close()).resolves.toBeUndefined();
    });
  });
});
