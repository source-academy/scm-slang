// eslint.config.js
export default [
  {
    files: ["**/*.ts", "**/*.js"],
    ignores: ["dist/**", "node_modules/**"], // You can add more folders to ignore here
    languageOptions: {
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
    },
    rules: {
      // add your rules or leave empty for defaults
    },
  },
];
