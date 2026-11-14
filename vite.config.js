import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        jogos: fileURLToPath(new URL('./index.html', import.meta.url)),
        roleta: fileURLToPath(new URL('./roleta.html', import.meta.url)),
        cacaNiqueis: fileURLToPath(new URL('./caca-niqueis.html', import.meta.url)),
        bolaDeCristal: fileURLToPath(new URL('./bola-de-cristal.html', import.meta.url))
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
})
