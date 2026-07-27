import type { AnomalyMode } from '../config/env.js';

export class InjectedOrderError extends Error {}

export class AnomalyService {
  constructor(private readonly mode: AnomalyMode, private readonly random: () => number = Math.random) {}

  async apply(): Promise<void> {
    if (this.mode === 'error' && this.random() < 0.2) throw new InjectedOrderError('Injected order-service error');
    if (this.mode === 'latency') {
      const delay = 3000 + Math.floor(this.random() * 2001);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
