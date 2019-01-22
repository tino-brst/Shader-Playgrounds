module.exports = {
	root: true,
	env: {
		node: true
	},
	"extends": [
		"plugin:vue/recommended",
		"@vue/standard",
		"@vue/typescript"
	],
	rules: {
		"no-console": "off",
		"no-debugger": "off",
		"no-useless-escape": "off",
		"space-in-parens": [ "error", "always" ],
		"quotes": [ "error", "double" ],
		"indent": [ "error", 4, { "SwitchCase": 1 } ],
		"space-before-function-paren": [ "error", "never" ],
		"space-unary-ops": [ 2, { "words": true, "nonwords": true } ],
		"no-multi-spaces": "off",
		"template-curly-spacing": [ "error", "always" ],
		// "padded-blocks": [ "error", "always" ],
		"no-useless-constructor": "off",
		"import/export": "off",
		"array-bracket-spacing": [ "error", "always" ],
		"arrow-body-style": [ "error", "as-needed" ],
		"arrow-parens": [ "error", "as-needed", { "requireForBlockBody": true } ],
        "arrow-spacing": "error",
        "semi": [ "error", "never" ],
		"vue/html-indent": [ "error", 4 ],
		"vue/max-attributes-per-line": false,
		"vue/attributes-order": false
	},
	parserOptions: {
		parser: "typescript-eslint-parser"
    }
}
