import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module'
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
  {
    files: ['Back-end/**/*.js'],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ['Front-End/**/*.js'],
    languageOptions: {
      globals: globals.browser
    }
  },
  {
    // Bibliotecas carregadas via <script> de CDN nas páginas de frequência/login
    files: ['Front-End/Aluno/Js/freq1.js', 'Front-End/Aluno/Js/freq2.js'],
    languageOptions: {
      globals: {
        Chart: 'readonly',
        ChartDataLabels: 'readonly',
        FullCalendar: 'readonly'
      }
    }
  },
  {
    files: ['Front-End/Login/Js/login.js'],
    languageOptions: {
      globals: {
        google: 'readonly'
      }
    }
  },
  { ignores: ['node_modules/', 'prisma/migrations/', 'coverage/'] }
];
