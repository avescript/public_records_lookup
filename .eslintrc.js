module.exports = {
  extends: ['next', 'next/core-web-vitals'],
  plugins: ['simple-import-sort'],
  rules: {
    // Import sorting rules
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',

    // Basic formatting rules
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],

    // React specific rules
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
  },
  overrides: [
    {
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      rules: {
        'simple-import-sort/imports': [
          'error',
          {
            groups: [
              // External packages
              ['^react', '^@?\\w'],
              // Internal packages
              ['^(@|components|utils|hooks|contexts|services|lib)(/.*|$)'],
              // Side effect imports
              ['^\\u0000'],
              // Parent imports
              ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
              // Other relative imports
              ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
              // Style imports
              ['^.+\\.?(css)$'],
            ],
          },
        ],
      },
    },
  ],
};
