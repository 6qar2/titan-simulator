import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/@react-three/fiber') || id.includes('node_modules/@react-three/drei')) return 'r3f'
          if (id.includes('node_modules/zustand')) return 'zustand'
          return undefined
        },
      },
    },
  },
  assetsInclude: ['**/*.glb', '**/*.gltf'],
})
