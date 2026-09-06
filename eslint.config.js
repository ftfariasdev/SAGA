import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        fetch: 'readonly',
        URL: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^next$|^_' }],
      'no-undef': 'error',
      'require-await': 'warn',
      'no-return-await': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['error', 'warn'] }]
    }
  },
  { ignores: ['node_modules/', 'prisma/migrations/', 'coverage/'] }
];
