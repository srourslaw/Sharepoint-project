import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,jsx}"]},
  {languageOptions: { globals: {
    ...globals.node,
    localStorage: true,
    fetch: true,
    window: true,
  } }},
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      "react/prop-types": 0,
      // "no-unused-vars": "off"
      "import/no-unresolved": ["error", { "commonjs": true, "amd": true }],
      "import/named": "error",
      "import/namespace": "error",
      "import/default": "error",
      "import/export": "error",
    }
  },
  {
    extends: [
      "eslint:recommended",
      "plugin:import/recommended",
      "plugin:react/recommended",
      "plugin:prettier/recommended"
    ]
  }
];