import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "umd",
    name: "ScmSlangRunner",
    sourcemap: false,
    globals: {},
  },
  plugins: [
    resolve({
      preferBuiltins: false,
      browser: true,
    }),
    commonjs({
      include: "node_modules/**",
      transformMixedEsModules: true,
      requireReturnsDefault: "auto",
    }),
    typescript({
      tsconfig: "./tsconfig.json",
    }),
  ],
};

export default config;
