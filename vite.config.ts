
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente (Vite precisa disso para acessar variáveis sem prefixo VITE_ no build)
  // Fix: use any cast to avoid type error on process.cwd() which is a valid Node.js method used by Vite
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: '/', 
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    define: {
      // Mapeia process.env.API_KEY para que o código possa acessá-la diretamente
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})
