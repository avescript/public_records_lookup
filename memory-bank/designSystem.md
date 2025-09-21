# Design System & Component Library

## Overview

A reusable component library that implements our design system, ensuring consistency across the application while supporting scalability and accessibility.

## Directory Structure

```
src/
  components/
    core/             # Base components
      Button/
        Button.tsx
        Button.test.tsx
        Button.stories.tsx
        types.ts
        styles.ts
      Input/
      Select/
      Card/
      Typography/
    composite/        # Composed components
      Form/
      DataGrid/
      Dialog/
      NavBar/
    layouts/          # Layout components
      Page/
      Section/
      Grid/
      Stack/
    patterns/         # Common UI patterns
      FilterBar/
      SearchBar/
      StatusBadge/
      ActionMenu/
    providers/        # Context providers
      Theme/
      Auth/
      Agency/
    shared/          # Utilities & hooks
      hooks/
      utils/
      constants/
```

## Design System

### 1. Design Tokens

```typescript
export const tokens = {
  colors: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrast: '#ffffff',
    },
    // ... other colors
  },
  typography: {
    fontFamilies: {
      body: '"Roboto", "Helvetica", "Arial", sans-serif',
      display: '"Roboto", "Helvetica", "Arial", sans-serif',
      mono: '"Roboto Mono", monospace',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
    },
    // ... other typography tokens
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  shadows: {
    // ...shadow definitions
  },
  breakpoints: {
    // ...breakpoint definitions
  },
  transitions: {
    // ...transition definitions
  },
};
```

### 2. Component Patterns

#### Base Components

Each base component should:

- Be fully typed with TypeScript
- Support theming and design tokens
- Include accessibility features
- Have comprehensive tests
- Include Storybook documentation
- Support dark mode
- Be responsive

Example Button Component:

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'text';
  size: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}

const Button = styled('button')<ButtonProps>`
  // Styled with design tokens
`;
```

### 3. Accessibility Patterns

- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support
- High contrast support
- Motion reduction support

### 4. Theme Configuration

```typescript
const theme = createTheme({
  palette: {
    primary: tokens.colors.primary,
    // ... other colors
  },
  typography: {
    fontFamily: tokens.typography.fontFamilies.body,
    // ... other typography settings
  },
  components: {
    MuiButton: {
      styleOverrides: {
        // ... component customizations
      },
    },
    // ... other component overrides
  },
});
```

## Usage Guidelines

### 1. Component Implementation

```typescript
// Example of a composite component
export const FilterBar = ({
  filters,
  onChange,
  onReset
}: FilterBarProps) => {
  return (
    <Stack direction="row" spacing={2}>
      <Select
        options={filters.status}
        onChange={(value) => onChange('status', value)}
      />
      <DateRangePicker
        value={filters.dateRange}
        onChange={(value) => onChange('dateRange', value)}
      />
      <Button variant="text" onClick={onReset}>
        Reset
      </Button>
    </Stack>
  );
};
```

### 2. Theme Usage

```typescript
const StyledCard = styled(Card)`
  ${({ theme }) => `
    padding: ${theme.spacing(2)};
    background: ${theme.palette.background.paper};
    border-radius: ${theme.shape.borderRadius}px;
  `}
`;
```

### 3. Responsive Design

```typescript
const ResponsiveGrid = styled(Grid)`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: 1fr;
    gap: ${theme.spacing(2)};

    ${theme.breakpoints.up('sm')} {
      grid-template-columns: repeat(2, 1fr);
    }

    ${theme.breakpoints.up('md')} {
      grid-template-columns: repeat(3, 1fr);
    }
  `}
`;
```

## Development Workflow

### 1. Adding New Components

1. Create component folder structure
2. Implement component with TypeScript
3. Add unit tests
4. Create Storybook stories
5. Document usage patterns
6. Review accessibility
7. Add to export index

### 2. Documentation Requirements

- Component API documentation
- Usage examples
- Accessibility notes
- Theme customization
- Responsive behavior
- Browser support

### 3. Quality Checks

- TypeScript strict mode
- Unit test coverage
- Accessibility testing
- Performance testing
- Visual regression tests
- Bundle size monitoring

## Future Considerations

- Component versioning
- Theme switching
- RTL support
- i18n integration
- Performance optimizations
- Additional accessibility features
