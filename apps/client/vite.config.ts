import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  root: '.',
  plugins: [react()],
  resolve: {
    alias: {
      '@recipe-explorer/common': path.resolve(__dirname, '../../libs/common/src/index.ts')
    },
  },
  build: {
    outDir: 'dist/apps/client',
  },
});
