import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appBase = env.VITE_APP_BASE || '/';
  const apiBaseUrl = env.VITE_API_BASE_URL || '/api';
  const apiProxyPath = apiBaseUrl.startsWith('/') ? apiBaseUrl.replace(/\/$/, '') : '/api';
  const frontendPort = Number(env.VITE_FRONTEND_PORT) || 5173;
  const coreFlowDevTarget =
    env.VITE_CORE_FLOW_DEV_TARGET ||
    env.VITE_CORE_FLOW_LOCAL_TARGET || env.VITE_CORE_FLOW_TARGET || 'http://localhost:5062';

  return {
    base: appBase,
    plugins: [vue(), tailwindcss()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
    server: {
      port: frontendPort,
      proxy: {
        [apiProxyPath]: {
          target: coreFlowDevTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
