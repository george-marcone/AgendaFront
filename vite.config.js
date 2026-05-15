import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const coreFlowTarget = env.VITE_CORE_FLOW_TARGET || 'http://localhost:5062';

  return {
    plugins: [vue(), tailwindcss()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: coreFlowTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
