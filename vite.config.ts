import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/veeva-racing/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@react-three/rapier']
  }
})
