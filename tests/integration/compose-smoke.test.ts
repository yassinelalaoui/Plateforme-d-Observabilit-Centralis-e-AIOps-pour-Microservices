import { describe, it, expect } from 'vitest';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8080';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:8081';
const ANOMALY_MODE = process.env.ANOMALY_MODE || 'normal';

describe('Docker Compose Smoke Integration Tests', () => {
  it('should verify services are healthy and reachable', async () => {
    // Verify Order Service health
    const orderHealth = await fetch(`${ORDER_SERVICE_URL}/health`);
    expect(orderHealth.status).toBe(200);
    const orderHealthBody = await orderHealth.json();
    expect(orderHealthBody.status).toBe('UP');

    // Verify User Service actuator health
    const userHealth = await fetch(`${USER_SERVICE_URL}/actuator/health`);
    expect(userHealth.status).toBe(200);
    const userHealthBody = await userHealth.json();
    expect(userHealthBody.status).toBe('UP');
  });

  if (ANOMALY_MODE === 'normal') {
    describe('Normal Mode Validation', () => {
      it('should successfully retrieve orders from Order Service', async () => {
        const res = await fetch(`${ORDER_SERVICE_URL}/orders`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('orders');
        expect(Array.isArray(body.orders)).toBe(true);
        expect(body.orders.length).toBeGreaterThan(0);
      });

      it('should successfully retrieve aggregated users from User Service', async () => {
        const res = await fetch(`${USER_SERVICE_URL}/users`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('users');
        expect(body.users.length).toBe(2);
        
        // Assert users have their orders attached
        const ada = body.users.find((u: any) => u.id === 'user-1');
        expect(ada).toBeDefined();
        expect(ada.orders.length).toBeGreaterThan(0);
      });
    });
  }

  if (ANOMALY_MODE === 'error') {
    describe('Error Anomaly Mode Validation', () => {
      it('should return approximately 20% HTTP 500 errors from Order Service', async () => {
        let successCount = 0;
        let errorCount = 0;
        
        // Run 50 requests to get a statistically relevant sample without being too slow
        for (let i = 0; i < 50; i++) {
          const res = await fetch(`${ORDER_SERVICE_URL}/orders`);
          if (res.status === 200) {
            successCount++;
          } else if (res.status === 500) {
            const body = await res.json();
            expect(body.code).toBe('INJECTED_ORDER_ERROR');
            errorCount++;
          } else {
            fail(`Unexpected status code: ${res.status}`);
          }
        }

        const total = successCount + errorCount;
        const errorRate = errorCount / total;
        
        console.log(`Error mode stats - Total: ${total}, Success: ${successCount}, Errors: ${errorCount}, Rate: ${errorRate}`);
        // Allow a wider margin due to statistical distribution in a smaller sample (e.g. 5% to 35%)
        expect(errorRate).toBeGreaterThanOrEqual(0.05);
        expect(errorRate).toBeLessThanOrEqual(0.40);
      });

      it('should map Order Service errors to HTTP 503 Service Unavailable in User Service', async () => {
        // Send requests until we hit an error in Order Service or verify User Service handles it
        let hit503 = false;
        for (let i = 0; i < 20; i++) {
          const res = await fetch(`${USER_SERVICE_URL}/users`);
          if (res.status === 503) {
            const body = await res.json();
            expect(body.code).toBe('ORDER_SERVICE_UNAVAILABLE');
            hit503 = true;
            break;
          } else {
            expect(res.status).toBe(200);
          }
        }
        
        // Since error rate is 20%, in 20 requests we have a 98.8% chance of hitting at least one error
        expect(hit503).toBe(true);
      });
    });
  }

  if (ANOMALY_MODE === 'latency') {
    describe('Latency Anomaly Mode Validation', () => {
      it('should delay requests to Order Service by 3 to 5 seconds', async () => {
        // Run 3 requests to verify the latency
        for (let i = 0; i < 3; i++) {
          const start = Date.now();
          const res = await fetch(`${ORDER_SERVICE_URL}/orders`);
          const duration = (Date.now() - start) / 1000;
          
          expect(res.status).toBe(200);
          // Accept slightly wider bounds for network/OS overhead (e.g. 2.9 to 5.5s)
          expect(duration).toBeGreaterThanOrEqual(2.9);
          expect(duration).toBeLessThanOrEqual(5.5);
        }
      });
    });
  }
});

function fail(message: string): never {
  throw new Error(message);
}
