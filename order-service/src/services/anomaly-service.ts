import type { AnomalyMode } from '../config/env.js';
import { mlAnomalyScore } from '../observability/telemetry.js';

export class InjectedOrderError extends Error {}

export class AnomalyService {
  private mode: AnomalyMode;

  constructor(initialMode: AnomalyMode, private readonly random: () => number = Math.random) {
    this.mode = initialMode;
    this.updateMetrics();
  }

  getMode(): AnomalyMode {
    return this.mode;
  }

  setMode(mode: AnomalyMode): void {
    this.mode = mode;
    this.updateMetrics();
  }

  private updateMetrics(): void {
    if (this.mode === 'normal') {
      mlAnomalyScore.set(0.05);
    } else {
      mlAnomalyScore.set(0.85);
    }
  }

  async apply(): Promise<void> {
    if (this.mode === 'error' && this.random() < 0.2) throw new InjectedOrderError('Injected order-service error');
    if (this.mode === 'latency') {
      const delay = 3000 + Math.floor(this.random() * 2001);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
