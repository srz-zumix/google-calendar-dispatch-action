// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'

import normalizeNodeModulesEol from './rollup/normalize-node-modules-eol.js'

const config = {
  input: 'src/index.ts',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true
  },
  plugins: [
    normalizeNodeModulesEol(),
    typescript(),
    nodeResolve({
      preferBuiltins: true,
      extensions: ['.js', '.ts', '.json']
    }),
    commonjs(),
    json()
  ]
}

export default config
