import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Note: the original brief used TsconfigPathsPlugin() inside `resolve.plugins`,
// but tsconfig-paths-webpack-plugin@4 mutates a webpack `compiler` object and
// crashes (`Cannot set properties of undefined (setting 'source')`) when Vite
// invokes it as a plain resolve plugin. We reproduce the exact same alias
// mapping that tsconfig.json declares (`@/*` -> `src/*`) using Vite's native
// resolve.alias, which is the vitest-idiomatic equivalent.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
