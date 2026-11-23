import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({ plugins: [react()], resolve: { dedupe: ['react', 'react-dom'], alias: [
  { find: /^react-dom(\/.*)?$/, replacement: local('./node_modules/react-dom') + '$1' },
  { find: /^react(\/.*)?$/, replacement: local('./node_modules/react') + '$1' },
  { find: 'buffer', replacement: local('./node_modules/buffer/index.js') },
] }, build: { sourcemap: false }, server: { host: '127.0.0.1', port: 5173, strictPort: true } });
