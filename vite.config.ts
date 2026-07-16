import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['chatbot.jpg', 'chat2.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Lydia Contact Center - Smart, Safe and Discreet SRHR Support',
        short_name: 'Lydia Contact Center',
        description: 'A safe, anonymous space for sexual and reproductive health support for youth in Ghana.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#FFFFFF',
        theme_color: '#0048ff',
        categories: ['health', 'education', 'lifestyle'],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/code4care-backend-production\.up\.railway\.app\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-runtime-cache',
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  envPrefix: 'VITE_',
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    sourcemap: false,
  },
  server: {
    port: 8080,
    open: false,
    proxy: {
      '/v1': {
        target: 'https://api.lydiacallcenter.org',
        changeOrigin: true,
        secure: true,
      },
      '/admin': {
        target: 'https://api.lydiacallcenter.org',
        changeOrigin: true,
        secure: true,
      },
      '/support-requests': {
        target: 'https://api.lydiacallcenter.org',
        changeOrigin: true,
        secure: true,
      },
      '/api/admin': {
        target: 'https://api.lydiacallcenter.org',
        changeOrigin: true,
        secure: true,
      },
      '/api/chat': {
        target: 'https://api.lydiacallcenter.org',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/v1/chat',
      },
      '/admin/login': {
        target: 'https://api.lydiacallcenter.org',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'motion/react'],
  },
});