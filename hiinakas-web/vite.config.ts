import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
      tsconfigPaths(),
      react(),
    ],
    server: {
      host: '0.0.0.0',
      port: 8087,
      proxy: {
        '/v1/hiinakas/': {
          target: 'http://localhost:3000',
          ws: true,
          secure: true,
          changeOrigin: true
        },
        '/socket.io': {
          target: 'https://localhost:3000',
          ws: true,
          secure: true,
          changeOrigin: true
        }
      }
    },
    css: {
      modules: {
        generateScopedName: 'wr-[path]:[local]'
      }
    }
  }
}) 