import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'tensorflow': ['@tensorflow/tfjs'],
          'physics': ['cannon-es'],
          'charts': ['chart.js']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['three', 'cannon-es', '@tensorflow/tfjs', 'chart.js']
  }
});
