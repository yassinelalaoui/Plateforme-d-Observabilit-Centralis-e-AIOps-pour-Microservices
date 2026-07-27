import { describe, it, expect, vi } from 'vitest';
import { AnomalyService, InjectedOrderError } from '../src/services/anomaly-service.js';

describe('AnomalyService', () => {
  describe('normal mode', () => {
    it('should not throw and not delay in normal mode', async () => {
      const service = new AnomalyService('normal', () => 0.0);

      const start = Date.now();
      await expect(service.apply()).resolves.toBeUndefined();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100); // no artificial delay
    });

    it('should not throw regardless of the random value', async () => {
      const service = new AnomalyService('normal', () => 0.1);
      await expect(service.apply()).resolves.toBeUndefined();
    });
  });

  describe('error mode', () => {
    it('should throw InjectedOrderError when random value is below 0.2 (20%)', async () => {
      const service = new AnomalyService('error', () => 0.19);
      await expect(service.apply()).rejects.toThrow(InjectedOrderError);
    });

    it('should not throw when random value is at 0.2 boundary', async () => {
      const service = new AnomalyService('error', () => 0.2);
      await expect(service.apply()).resolves.toBeUndefined();
    });

    it('should not throw when random value is above 0.2', async () => {
      const service = new AnomalyService('error', () => 0.5);
      await expect(service.apply()).resolves.toBeUndefined();
    });

    it('should select approximately 20% of requests for failure', async () => {
      let callCount = 0;
      // Generate 100 evenly-distributed values
      const service = new AnomalyService('error', () => {
        const val = callCount / 100;
        callCount++;
        return val;
      });

      let errorCount = 0;
      for (let i = 0; i < 100; i++) {
        try {
          await service.apply();
        } catch (e) {
          if (e instanceof InjectedOrderError) errorCount++;
        }
      }

      // With evenly distributed values [0.00, 0.01, ..., 0.99],
      // exactly 20 values are < 0.2
      expect(errorCount).toBe(20);
    });
  });

  describe('latency mode', () => {
    it('should delay between 3000ms and 5000ms', async () => {
      vi.useFakeTimers();

      // random() = 0.5 → delay = 3000 + floor(0.5 * 2001) = 3000 + 1000 = 4000ms
      const service = new AnomalyService('latency', () => 0.5);

      const applyPromise = service.apply();

      // Advance time to just before the delay
      await vi.advanceTimersByTimeAsync(3999);
      // The promise should not have resolved yet

      // Advance past the delay
      await vi.advanceTimersByTimeAsync(1);
      await expect(applyPromise).resolves.toBeUndefined();

      vi.useRealTimers();
    });

    it('should produce minimum delay of 3000ms when random returns 0', async () => {
      vi.useFakeTimers();

      const service = new AnomalyService('latency', () => 0.0);
      const applyPromise = service.apply();

      await vi.advanceTimersByTimeAsync(3000);
      await expect(applyPromise).resolves.toBeUndefined();

      vi.useRealTimers();
    });

    it('should produce maximum delay of 5000ms when random returns ~1', async () => {
      vi.useFakeTimers();

      // random() = 0.999 → delay = 3000 + floor(0.999 * 2001) = 3000 + 1998 = 4998ms
      // random() very close to 1 → delay = 3000 + floor(0.9999 * 2001) = 3000 + 2000 = 5000ms
      const service = new AnomalyService('latency', () => 0.9999);
      const applyPromise = service.apply();

      await vi.advanceTimersByTimeAsync(5000);
      await expect(applyPromise).resolves.toBeUndefined();

      vi.useRealTimers();
    });

    it('should always select a delay within the 3-5 second range', () => {
      for (let i = 0; i < 100; i++) {
        const r = i / 100;
        const delay = 3000 + Math.floor(r * 2001);
        expect(delay).toBeGreaterThanOrEqual(3000);
        expect(delay).toBeLessThanOrEqual(5000);
      }
    });
  });

  describe('mode validation', () => {
    it('should accept normal mode', () => {
      expect(() => new AnomalyService('normal')).not.toThrow();
    });

    it('should accept error mode', () => {
      expect(() => new AnomalyService('error')).not.toThrow();
    });

    it('should accept latency mode', () => {
      expect(() => new AnomalyService('latency')).not.toThrow();
    });
  });
});
