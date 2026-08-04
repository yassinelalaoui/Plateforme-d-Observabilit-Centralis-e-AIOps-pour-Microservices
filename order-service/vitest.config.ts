import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/**/*.test.ts',
      'test/**/*.test.ts',
      '**/tests/**/*.test.ts',
      '**/test/**/*.test.ts',
    ],
    // Disable worker threads for networked integration tests so fetch/DNS
    // behave consistently inside Docker containers, and increase timeout.
    threads: false,
    testTimeout: 20000,
  },
});
