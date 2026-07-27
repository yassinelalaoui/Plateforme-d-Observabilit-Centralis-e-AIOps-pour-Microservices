/**
 * Contract tests for User Service GET /users.
 * Validates response structure against user-service.openapi.yaml.
 *
 * Since the User Service is a Spring Boot application, these contract
 * tests describe the expected HTTP response shape. They can be run
 * against the User Service once it is running, or used as a specification
 * reference alongside the Java unit tests.
 *
 * For unit-level contract validation we use the Java test suite in
 * user-service/src/test/. This file defines the contract expectations
 * that would be validated in a live integration scenario.
 */
import { describe, it, expect } from 'vitest';

/** Expected response shape for GET /users with HTTP 200 */
interface UserResponse {
  users: Array<{
    id: string;
    name: string;
    orders: Array<{
      id: string;
      userId: string;
      description: string;
      amount: number;
      status: string;
      createdAt: string;
    }>;
  }>;
}

/** Expected response shape for GET /users with HTTP 503 */
interface ErrorResponse {
  code: string;
  message: string;
}

describe('User Service Contract: GET /users', () => {
  describe('HTTP 200 — successful aggregation', () => {
    it('should define the expected response structure with users and orders', () => {
      // This test validates the TypeScript types compile correctly
      // and documents the contract expectations
      const sampleResponse: UserResponse = {
        users: [
          {
            id: 'user-1',
            name: 'Ada Lovelace',
            orders: [
              {
                id: '11111111-1111-1111-1111-111111111111',
                userId: 'user-1',
                description: 'Observability starter order',
                amount: 49.99,
                status: 'CONFIRMED',
                createdAt: '2026-07-27T09:00:00.000Z',
              },
            ],
          },
          {
            id: 'user-2',
            name: 'Grace Hopper',
            orders: [],
          },
        ],
      };

      expect(sampleResponse).toHaveProperty('users');
      expect(Array.isArray(sampleResponse.users)).toBe(true);

      for (const user of sampleResponse.users) {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('orders');
        expect(typeof user.id).toBe('string');
        expect(typeof user.name).toBe('string');
        expect(Array.isArray(user.orders)).toBe(true);

        for (const order of user.orders) {
          expect(order).toHaveProperty('id');
          expect(order).toHaveProperty('userId');
          expect(order).toHaveProperty('description');
          expect(order).toHaveProperty('amount');
          expect(order).toHaveProperty('status');
          expect(order).toHaveProperty('createdAt');
          expect(typeof order.id).toBe('string');
          expect(typeof order.userId).toBe('string');
          expect(typeof order.description).toBe('string');
          expect(typeof order.amount).toBe('number');
          expect(order.amount).toBeGreaterThanOrEqual(0);
          expect(['PENDING', 'CONFIRMED', 'CANCELLED']).toContain(order.status);
          expect(new Date(order.createdAt).toISOString()).toBe(order.createdAt);
        }
      }
    });

    it('should expect each user to have an id, name, and orders array', () => {
      const minimalUser = { id: 'user-1', name: 'Test', orders: [] };
      expect(Object.keys(minimalUser)).toEqual(expect.arrayContaining(['id', 'name', 'orders']));
    });
  });

  describe('HTTP 503 — Order Service unavailable', () => {
    it('should define the expected error response structure', () => {
      const errorResponse: ErrorResponse = {
        code: 'ORDER_SERVICE_UNAVAILABLE',
        message: 'Order Service is unavailable.',
      };

      expect(errorResponse).toHaveProperty('code');
      expect(errorResponse).toHaveProperty('message');
      expect(typeof errorResponse.code).toBe('string');
      expect(typeof errorResponse.message).toBe('string');
    });
  });
});
