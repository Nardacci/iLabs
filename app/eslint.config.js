// @ts-check
const eslint = require('@eslint/js');
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  globalIgnores(['src/tipos-do-banco.ts', 'src/ambiente.gerado.ts', 'dist/**', 'node_modules/**', 'e2e/**', 'scripts/**', 'playwright-report/**', 'test-results/**']),
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked, angular.configs.tsRecommended],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: __dirname } },
    processor: angular.processInlineTemplates,
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      // Validators.required etc. do Angular são funções soltas por desenho (falso positivo conhecido).
      '@typescript-eslint/unbound-method': 'off',
      // `() => this.sinal.set(x)` é o jeito normal de escrever com signals.
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true, allowTypedFunctionExpressions: true }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'il', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'il', style: 'kebab-case' }],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/no-host-metadata-property': 'off',
      '@angular-eslint/prefer-inject': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off', '@typescript-eslint/explicit-function-return-type': 'off', '@typescript-eslint/no-floating-promises': 'off' },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: { '@angular-eslint/template/prefer-ngsrc': 'error', '@angular-eslint/template/prefer-control-flow': 'error', '@angular-eslint/template/no-inline-styles': 'off' },
  },
]);
