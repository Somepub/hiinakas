import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
      react(),
      tsconfigPaths(),
      viteStaticCopy({
        targets: [
          { src: "./src/assets/cards", dest: "./cards" },
          { src: "./src/assets/area", dest: "./area" },
        ]
      })
    ],
    resolve: {
      alias: {
        '@common': path.resolve(__dirname, '../hiinakas-common/src/'),
      }
    },
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