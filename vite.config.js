import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { readdirSync } from 'node:fs'

// Todas as páginas .html da raiz, de jogos/ e de streamer/ entram no build
const raiz = fileURLToPath(new URL('.', import.meta.url))
const paginas = {}
for (const pasta of ['', 'jogos', 'streamer']) {
  for (const arquivo of readdirSync(raiz + pasta)) {
    if (!arquivo.endsWith('.html')) continue
    const nome = (pasta ? `${pasta}/` : '') + arquivo.replace(/\.html$/, '')
    paginas[nome] = fileURLToPath(new URL(`./${pasta ? pasta + '/' : ''}${arquivo}`, import.meta.url))
  }
}

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: paginas,
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
})
