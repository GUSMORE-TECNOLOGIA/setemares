import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	
	return {
		plugins: [
			react(),
			// Bundle analyzer - só em produção
			mode === 'production' && visualizer({
				filename: 'dist/bundle-analysis.html',
				open: false,
				gzipSize: true,
				brotliSize: true,
			})
		].filter(Boolean),
		resolve: {
			alias: { '@': path.resolve(__dirname, 'src') }
		},
	define: {
		'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
		'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
		'import.meta.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY || ''),
		'import.meta.env.USE_AI_CONCIERGE': JSON.stringify(env.USE_AI_CONCIERGE || 'false'),
		'import.meta.env.CACHE_TTL_MIN': JSON.stringify(env.CACHE_TTL_MIN || '360'),
	},
		server: {
			proxy: {
				'/api': {
					target: 'http://localhost:3001',
					changeOrigin: true,
					secure: false,
				}
			}
		},
		build: {
			rollupOptions: {
				output: {
					manualChunks: {
						// Separar bibliotecas pesadas
						'pdf-renderer': ['@react-pdf/renderer'],
						'react-vendor': ['react', 'react-dom'],
						'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-icons', '@radix-ui/react-scroll-area', '@radix-ui/react-separator', '@radix-ui/react-slot', '@radix-ui/react-switch', '@radix-ui/react-tooltip'],
						'form-vendor': ['react-hook-form', '@hookform/resolvers', 'react-number-format'],
						'utils-vendor': ['clsx', 'tailwind-merge', 'zod'],
						'supabase': ['@supabase/supabase-js'],
						'framer-motion': ['framer-motion'],
						'lucide': ['lucide-react']
					}
				}
			},
			chunkSizeWarningLimit: 1000
		}
	};
});
