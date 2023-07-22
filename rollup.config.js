import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
 
export default {
  input: 'src/script/index.js',
  output: {
    file: './dist/ulibs.js',
    format: 'iife',
  },
  plugins: [
    replace({ 
      'process.env.NODE_ENV': JSON.stringify('development') 
    }),
    resolve()
  ]
}