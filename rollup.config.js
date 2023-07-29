import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs';
 
export default {
  input: 'src/script/index.js',
  output: {
    file: './dist/ulibs.js',
    format: 'iife',
    inlineDynamicImports: true,
  },
  context: 'window',
  plugins: [
    replace({ 
      'process.env.NODE_ENV': JSON.stringify('development') ,
      preventAssignment: true,
    }),
    resolve(),
    commonjs(),
  ]
}