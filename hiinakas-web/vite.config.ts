import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { compression } from 'vite-plugin-compression2'

export default defineConfig(({ command, mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [
      tsconfigPaths(),
      react(),
      cssInjectedByJsPlugin(),
      compression()
    ],
    server: {
      host: '0.0.0.0',
      port: 8087,
    },
    css: {
      modules: {
        generateScopedName: 'wr-[path]:[local]',
      }
    },
    build: {
      sourcemap: isDev,
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          entryFileNames: 'hiinakas.js',
        }
      },
      assetsInlineLimit: 100000000000,
    },
    resolve: {
      alias: {
        react: 'preact/compat',
        'react-dom': 'preact/compat',
      },

    }
  }
}) 