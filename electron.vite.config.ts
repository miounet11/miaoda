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
    build: {
      // Optimize bundle size
      target: 'esnext',
      minify: 'terser',
      cssMinify: true,
      
      // Configure rollup for better tree shaking and chunking
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
                return 'vue-vendor'
              }
              if (id.includes('echarts')) {
                return 'chart-libs'
              }
              if (id.includes('@vueuse') || id.includes('lucide')) {
                return 'ui-vendor'
              }
              if (id.includes('jspdf') || id.includes('html2canvas') || 
                  id.includes('docx') || id.includes('xlsx')) {
                return 'export-libs'
              }
              return 'vendor'
            }
            
            // Feature chunks based on actual file paths
            if (id.includes('/analytics/')) {
              return 'analytics'
            }
            if (id.includes('/export/')) {
              return 'export-features'
            }
            if (id.includes('/plugin/')) {
              return 'plugin-system'
            }
            if (id.includes('/locales/')) {
              return 'locales'
            }
            
            return undefined
          },
          
          // Optimize chunk names
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]'
        }
      },
      
      // Terser optimization
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug'],
          passes: 2
        },
        mangle: true,
        format: {
          comments: false
        }
      },
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Source map configuration
      sourcemap: false,
      
      // Chunk size warnings
      chunkSizeWarningLimit: 300,
      
      // Optimize dependencies
      optimizeDeps: {
        include: [
          'vue',
          'vue-router', 
          'pinia'
        ],
        exclude: [
          'jspdf',
          'html2canvas', 
          'docx',
          'xlsx'
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
      drop: ['console', 'debugger'],
      logOverride: { 
        'duplicate-object-key': 'silent',
        'this-is-undefined-in-esm': 'silent'
      }
    }
  }
})
