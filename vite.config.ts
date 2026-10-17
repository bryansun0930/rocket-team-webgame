import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  base: loadEnv(mode, '.', 'VITE_').VITE_BASE_PATH || './',
}));
