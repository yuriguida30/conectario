
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente necessárias apenas para o build, 
  // mas não define process.env manualmente para não interferir com a injeção automática
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: '/', 
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    define: {
      // Removemos a definição de process.env.API_KEY para permitir a injeção automática do ambiente
    }
  }
})
