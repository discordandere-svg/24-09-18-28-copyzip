import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': import.meta.dirname,
      },
    },
    server: {
      port: 5000,
      host: '0.0.0.0',
      allowedHosts: true as const,
      strictPort: true,
      // HMR can be disabled in constrained preview environments.
      // File watching can be disabled in constrained preview environments.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching with HMR to reduce preview CPU usage.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
