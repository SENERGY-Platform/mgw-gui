// @ts-check
const eslint = require('@eslint/js');
const {defineConfig} = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    // Build output, not source. The coverage report in particular contains
    // generated .ts.html files that the Angular template parser chokes on,
    // and it only exists after a run with --code-coverage.
    ignores: ['dist/', 'coverage/', '.angular/'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Two prefixes on purpose: 'app' for feature components, 'mgw' for the
      // shared design-system primitives, so a template shows at a glance
      // whether an element is reusable. Components predating this carry no
      // prefix at all and sit in the suppressions baseline.
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: ['app', 'mgw'],
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: ['app', 'mgw'],
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
