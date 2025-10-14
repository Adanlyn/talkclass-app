import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
plugins: [react()],
  server: {
    host: true,           // 0.0.0.0 dentro do container
    port: 5174,
    strictPort: true,
    watch: { usePolling: true },  // chave p/ Docker Desktop
    hmr: {
      host: 'localhost',  // browser conecta no host
      clientPort: 5174,   // mesma porta publicada pelo compose
    },
  },
})
