import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    // Disable fast refresh for now to test if it's causing issues
    fastRefresh: false
  })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
    allowedHosts: [
      'ws-fdfd-ae-bbea-jaelnewksz.cn-hongkong-vpc.fcapp.run',
      'localhost',
      '127.0.0.1'
    ],
  },
})