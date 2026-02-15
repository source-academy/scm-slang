import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'src/conductor/SchemeEvaluator.ts',
    output: {
      file: 'dist/scheme-evaluator.cjs',
      format: 'cjs',
      name: 'SchemeSlangEvaluator',
      sourcemap: true
    },
    external: ['@sourceacademy/conductor'],
    plugins: [
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      nodeResolve()
    ]
  }
];