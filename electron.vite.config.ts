import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        output: {
          format: 'cjs',
          entryFileNames: '[name].js'
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@renderer': resolve('src/renderer'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [vue()],
    css: {
      postcss: {
        plugins: [
          tailwindcss('./tailwind.config.js'),
          autoprefixer()
        ]
      }
    },
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: true,
      hmr: {
        port: 5174,
        host: '127.0.0.1'
      },
      watch: {
        usePolling: false
      }
    },
    esbuild: {
      logOverride: { 'duplicate-object-key': 'silent' }
    }
  }
})
