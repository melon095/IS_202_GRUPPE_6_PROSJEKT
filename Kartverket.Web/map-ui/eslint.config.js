import js from "@eslint/js";
import pluginQuery from "@tanstack/eslint-plugin-query";
import importPlugin from "eslint-plugin-import";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{ ignores: ["dist", "node_modules", "vite.config.js"] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	...pluginQuery.configs["flat/recommended"],
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			globals: globals.browser,
		},
		plugins: {
			"react-hooks": reactHooks,
			"react-refresh": reactRefresh,
			import: importPlugin,
		},
		settings: {
			"import/resolver": {
				typescript: true,
				node: true,
			},
		},
		rules: {
			...reactHooks.configs.recommended.rules,
			"react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
			"import/no-unresolved": "error",
			"import/no-cycle": "warn",
			"import/no-self-import": "error",
			"import/extensions": [
				"error",
				"never",
				{
					json: "always",
				},
			],
		},
	}
);
