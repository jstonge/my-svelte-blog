import adapter from '@sveltejs/adapter-vercel';
import { readFileSync } from 'fs';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const storiesCSV = readFileSync('src/data/stories.csv', 'utf-8');
const storiesIds = storiesCSV.split('\n').slice(1).filter(line => line.trim()).map(line => line.split(',')[0]);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		prerender: {
			entries: [
				'*',
				...storiesIds.map(id => `/${id}`)
			]
		},
		adapter: adapter(),
		alias: {
			$data: './src/data'
		},
		experimental: {
			remoteFunctions: true,
		},
	},
	compilerOptions: {
		experimental: {
			async: true,
		},
	},
	vitePlugin: {
		inspector: true,
	},
}

export default config