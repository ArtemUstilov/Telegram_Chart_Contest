import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import serve from 'rollup-plugin-serve';
import copy from 'rollup-plugin-copy-glob';

import { terser } from 'rollup-plugin-terser';

const watch = !!process.env.ROLLUP_WATCH;
const port = parseInt(process.env.PORT, 10) || 8088;
const isWin = process.platform === 'win32';

export default {
	input: 'src/main.js',
	output: {
		file: 'public/bundle.js',
		format: 'iife', // immediately-invoked function expression — suitable for <script> tags
		sourcemap: true
	},
	plugins: [
		resolve(), // tells Rollup how to find date-fns in node_modules
		commonjs(), // converts date-fns to ES modules
		copy([
			{ files: 'examples/**', dest: 'dist' },
		], { verbose: true, watch: true }),
		!watch && terser(), // minify, but only in production,
		watch && !isWin && serve({
			open: true,
			contentBase: 'dist',
			port,
		}),
	]
};
