import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from "path";
import dsv from "@rollup/plugin-dsv"; // import foo from 'foo.csv'

// TODO: remove once the server's SSL certificate chain is fixed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default defineConfig({
	plugins: [sveltekit(), dsv()],
	resolve: {
		alias: {
			$data: path.resolve("./src/data"),
			$styles: path.resolve("./src/styles"),
		}
	},
});
