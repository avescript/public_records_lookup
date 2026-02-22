module.exports = {
  extends: ['next', 'next/core-web-vitals', 'plugin:storybook/recommended'],
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

    // Migration layer enforcement - guide developers to use migration components
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@mui/material/Button',
            message:
              'Use Button from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/TextField',
            message:
              'Use TextField from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Select',
            message:
              'Use Select from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Checkbox',
            message:
              'Use Checkbox from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Radio',
            message:
              'Use Radio from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/RadioGroup',
            message:
              'Use RadioGroup from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/FormControl',
            message:
              'Use FormControl from "@/components/migration" instead for gradual design system adoption',
          },
        ],
        patterns: [
          {
            group: [
              '@mui/material/*Button*',
              '@mui/material/*TextField*',
              '@mui/material/*Select*',
              '@mui/material/*Checkbox*',
              '@mui/material/*Radio*',
              '@mui/material/*Form*',
            ],
            message:
              'Use migration layer components from "@/components/migration" for gradual design system adoption',
          },
        ],
      },
    ],
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
