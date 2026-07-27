import { Pool } from 'pg';
import type { Order } from '../models/order.js';

export interface OrderRepository {
  findAll(): Promise<Order[]>;
  ping(): Promise<void>;
  close(): Promise<void>;
}

export function createOrderRepository(connectionString: string): OrderRepository {
  const pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 10_000 });
  return {
    async findAll() {
      const result = await pool.query('SELECT id, user_id, description, amount, status, created_at FROM orders ORDER BY created_at');
      return result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        description: row.description,
        amount: Number(row.amount),
        status: row.status,
        createdAt: new Date(row.created_at).toISOString()
      }));
    },
    async ping() { await pool.query('SELECT 1'); },
    async close() { await pool.end(); }
  };
}
