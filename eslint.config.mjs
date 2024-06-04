// This includes a modification of https://github.com/wikimedia-gadgets/twinkle/blob/master/.eslintrc.json (CC BY-SA).
import globals from 'globals';
import pluginJs from '@eslint/js';
import stylisticJs from '@stylistic/eslint-plugin-js';

export default [
	pluginJs.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.jquery,
				mw: 'readonly',
				Map: 'readonly'
			}
		},
		rules: {
			'array-bracket-spacing': 'error',
			'block-scoped-var': 'error',
			'curly': 'error',
			'default-case': 'error',
			'dot-notation': 'error',
			'eqeqeq': 'error',
			'guard-for-in': 'error',
			'no-array-constructor': 'error',
			'no-bitwise': 'error',
			'no-caller': 'error',
			'no-console': ['error', {allow: ['warn', 'error']}],
			'no-else-return': 'error',
			'no-implicit-coercion': ['error', {boolean: false}],
			'no-lone-blocks': 'error',
			'no-nested-ternary': 'error',
			'no-object-constructor': 'error',
			'no-restricted-syntax': [
				'warn', {
					message: 'Using .done() is discouraged. See https://www.mediawiki.org/wiki/Manual:Coding_conventions/JavaScript#Asynchronous_code',
					selector: 'MemberExpression > Identifier[name="done"]'
				}, {
					message: 'Using .fail() is discouraged. See https://www.mediawiki.org/wiki/Manual:Coding_conventions/JavaScript#Asynchronous_code',
					selector: 'MemberExpression > Identifier[name="fail"]'
				}
			],
			'no-unneeded-ternary': 'error',
			'no-unreachable-loop': 'error',
			'no-useless-return': 'error',
			'yoda': 'error'
		}
	},
	stylisticJs.configs['all-flat'],
	{
		plugins: {
			'@stylistic/js': stylisticJs
		},
		rules: {
			'@stylistic/js/array-element-newline': [
				'error',
				{
					ArrayExpression: 'consistent',
					ArrayPattern: {
						multiline: true,
						minItems: 3
					}
				}
			],
			'@stylistic/js/dot-location': ['error', 'property'],
			'@stylistic/js/function-call-argument-newline': ['error', 'consistent'],
			'@stylistic/js/indent': [
				'error', 'tab', {
					outerIIFEBody: 0,
					SwitchCase: 1
				}
			],
			'@stylistic/js/lines-around-comment': ['error', {allowBlockStart: true}],
			'@stylistic/js/multiline-ternary': ['error', 'always-multiline'],
			'@stylistic/js/no-tabs': [
				'error', {
					allowIndentationTabs: true
				}
			],
			'@stylistic/js/padded-blocks': ['error', 'never'],
			'@stylistic/js/quote-props': ['error', 'consistent-as-needed'],
			'@stylistic/js/quotes': [
				'error', 'single', {
					avoidEscape: true
				}
			],
			'@stylistic/js/space-before-function-paren': ['error', 'never'],
			'@stylistic/js/spaced-comment': [
				'error', 'always', {
					block: {
						balanced: true
					},
					line: {
						exceptions: ['-']
					}
				}
			]
		}
	}
];
