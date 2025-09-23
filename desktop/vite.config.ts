import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	
	return {
		plugins: [react()],
		base: './',
		resolve: {
			alias: { '@': path.resolve(__dirname, 'src') }
		},
		build: {
			assetsDir: 'assets',
			rollupOptions: {
				output: {
					assetFileNames: 'assets/[name]-[hash][extname]',
					chunkFileNames: 'assets/[name]-[hash].js',
					entryFileNames: 'assets/[name]-[hash].js'
				}
			}
		},
		define: {
			'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
			'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
		}
	};
});
