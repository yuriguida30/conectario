import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo (development/production)
  // Fix: Property 'cwd' does not exist on type 'Process' error. Casting to any to invoke cwd().
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: '/', 
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    define: {
      // Isso permite que o código use process.env.API_KEY no navegador
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})