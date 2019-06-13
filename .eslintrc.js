module.exports = {
	root: true,
	env: {
		node: true
	},
	plugins: ["@typescript-eslint"],
	parserOptions: {
		parser: "@typescript-eslint/parser",
		project: "./tsconfig.json"
	},
	extends: [
		"plugin:vue/strongly-recommended",
		"standard"
	],
	rules: {
		// Replace eslint rules with Typescript-aware equivalents (when available)
		"no-unused-vars": "off",
		"no-useless-constructor": "off",
		"no-undef": "off",
		"no-useless-escape": "warn",
		"@typescript-eslint/no-unused-vars": "warn",
		"@typescript-eslint/no-useless-constructor": "warn",
	},
	overrides: [
    {
      files: ["*.d.ts"],
      rules: {
        "@typescript-eslint/no-unused-vars": "off",
      }
    }
  ]
}
