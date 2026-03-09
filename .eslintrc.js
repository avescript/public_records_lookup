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
          {
            name: '@mui/material/Box',
            message:
              'Use Box from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Typography',
            message:
              'Use Typography from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Alert',
            message:
              'Use Alert from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Chip',
            message:
              'Use Chip from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Stack',
            message:
              'Use Stack from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Divider',
            message:
              'Use Divider from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/IconButton',
            message:
              'Use IconButton from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Tooltip',
            message:
              'Use Tooltip from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/LinearProgress',
            message:
              'Use LinearProgress from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Dialog',
            message:
              'Use Dialog from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/DialogActions',
            message:
              'Use DialogActions from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/DialogContent',
            message:
              'Use DialogContent from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/DialogTitle',
            message:
              'Use DialogTitle from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/List',
            message:
              'Use List from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/ListItem',
            message:
              'Use ListItem from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/ListItemButton',
            message:
              'Use ListItemButton from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/ListItemIcon',
            message:
              'Use ListItemIcon from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/ListItemText',
            message:
              'Use ListItemText from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/ListItemSecondaryAction',
            message:
              'Use ListItemSecondaryAction from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Container',
            message:
              'Use Container from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Grid',
            message:
              'Use Grid from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/MenuItem',
            message:
              'Use MenuItem from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/InputLabel',
            message:
              'Use InputLabel from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/FormControlLabel',
            message:
              'Use FormControlLabel from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/AlertTitle',
            message:
              'Use AlertTitle from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/AppBar',
            message:
              'Use AppBar from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Avatar',
            message:
              'Use Avatar from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Backdrop',
            message:
              'Use Backdrop from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Badge',
            message:
              'Use Badge from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/CardActions',
            message:
              'Use CardActions from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/CardHeader',
            message:
              'Use CardHeader from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Collapse',
            message:
              'Use Collapse from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Drawer',
            message:
              'Use Drawer from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/FormGroup',
            message:
              'Use FormGroup from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/FormLabel',
            message:
              'Use FormLabel from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Popover',
            message:
              'Use Popover from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Rating',
            message:
              'Use Rating from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Slider',
            message:
              'Use Slider from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Snackbar',
            message:
              'Use Snackbar from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Step',
            message:
              'Use Step from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/StepContent',
            message:
              'Use StepContent from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/StepLabel',
            message:
              'Use StepLabel from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Stepper',
            message:
              'Use Stepper from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Switch',
            message:
              'Use Switch from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Tab',
            message:
              'Use Tab from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Tabs',
            message:
              'Use Tabs from "@/components/migration" instead for gradual design system adoption',
          },
          {
            name: '@mui/material/Toolbar',
            message:
              'Use Toolbar from "@/components/migration" instead for gradual design system adoption',
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
              '@mui/material/*Box*',
              '@mui/material/*Typography*',
              '@mui/material/*Alert*',
              '@mui/material/*Chip*',
              '@mui/material/*Stack*',
              '@mui/material/*Divider*',
              '@mui/material/*Tooltip*',
              '@mui/material/*Progress*',
              '@mui/material/*Dialog*',
              '@mui/material/*List*',
              '@mui/material/*Container*',
              '@mui/material/*Grid*',
              '@mui/material/*MenuItem*',
              '@mui/material/*InputLabel*',
              '@mui/material/*AppBar*',
              '@mui/material/*Avatar*',
              '@mui/material/*Backdrop*',
              '@mui/material/*Badge*',
              '@mui/material/*Card*',
              '@mui/material/*Collapse*',
              '@mui/material/*Drawer*',
              '@mui/material/*Popover*',
              '@mui/material/*Rating*',
              '@mui/material/*Slider*',
              '@mui/material/*Snackbar*',
              '@mui/material/*Step*',
              '@mui/material/*Stepper*',
              '@mui/material/*Switch*',
              '@mui/material/*Tab*',
              '@mui/material/*Toolbar*',
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
