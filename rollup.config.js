import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import serve from 'rollup-plugin-serve';
import copy from 'rollup-plugin-copy-glob';
import gzipPlugin from 'rollup-plugin-gzip'
import babel from 'rollup-plugin-babel';
import multiEntry from 'rollup-plugin-multi-entry';
import progress from 'rollup-plugin-progress';
import { terser } from 'rollup-plugin-terser';

const watch = !!process.env.ROLLUP_WATCH;
const port = parseInt(process.env.PORT, 10) || 8088;
const isWin = process.platform === 'win32';

const babelOptions = Object.assign(
  {
    exclude: /node_modules/,
    babelrc: false,
    extensions: ['.js']
  },
  require('./.babelrc.js')
);

export default {
	input: 'src/main.js',
	output: {
		file: 'public/bundle.js',
		format: 'iife', // immediately-invoked function expression — suitable for <script> tags
		sourcemap: true
	},
	plugins: [
		resolve(), // tells Rollup how to find date-fns in node_modules
		commonjs(),
    gzipPlugin(),
    multiEntry(),
    progress(),
    babel(babelOptions),
		copy([
			{ files: 'examples/**', dest: 'dist' },
		], { verbose: true, watch: true }),
		watch && !isWin && serve({
			open: true,
			contentBase: 'dist',
			port,
		}),
	]
};
