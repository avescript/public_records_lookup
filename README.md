# Public Records Lookup Application

A sophisticated public records management system with AI-assisted processing and design system migration capabilities.

## 🚀 Quick Start

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Migration Dashboard (Development Only)

Enable the migration dashboard to track design system adoption progress:

```typescript
// In your app root
import { MigrationProvider } from '@/components/migration';

<MigrationProvider showDashboard={true}>
  <YourApp />
</MigrationProvider>
```

## 📚 Documentation

### Migration Documentation

The project includes a comprehensive migration layer for transitioning from Material-UI to our design system while maintaining backward compatibility:

- **[Migration Guide](./MIGRATION_GUIDE.md)** - Complete guide for developers migrating components
- **[Migration API Reference](./MIGRATION_API_REFERENCE.md)** - Technical API documentation and interfaces
- **[Migration Code Review Checklist](./MIGRATION_CODE_REVIEW_CHECKLIST.md)** - Quality assurance guidelines for code reviews

### Additional Documentation

- **[Design System Progress](./memory-bank/designSystem.md)** - Design system implementation status
- **[Testing Patterns](./memory-bank/testingPatterns.md)** - Testing guidelines and patterns
- **[Git Workflow Solutions](./GIT_WORKFLOW_SOLUTIONS.md)** - Solutions to common Git workflow issues

## 🏗 Architecture Overview

### Migration Layer

The migration layer provides seamless compatibility between Material-UI components and our design system:

```typescript
// Import from migration layer instead of Material-UI
import { Button, TextField, Select } from '@/components/migration';

// Migration layer automatically:
// - Uses design system for simple props
// - Falls back to Material-UI for complex props (sx, component, etc.)
// - Tracks usage statistics in development
// - Provides migration guidance via dashboard
```

### Project Structure

```
src/
├── components/
│   ├── migration/          # Migration layer adapters
│   │   ├── adapters.tsx    # Component adapters (Button, TextField, etc.)
│   │   └── index.ts        # Migration layer exports
│   ├── development/        # Development-only tools
│   │   └── MigrationDashboard.tsx
│   └── design-system/      # Native design system components
├── hooks/
│   └── useMigrationStats.tsx  # Migration tracking hook
├── contexts/               # React contexts
├── services/              # Business logic services
└── utils/                 # Utility functions

__tests__/                 # Test files
memory-bank/               # Project documentation and context
```

## 🎨 Design System Migration

### Current Status

The project is actively migrating from Material-UI to a custom design system. The migration layer ensures:

- **Zero Breaking Changes**: Existing components continue to work
- **Progressive Enhancement**: Gradual adoption of design system components
- **Development Tracking**: Real-time migration progress visibility
- **Smart Fallbacks**: Automatic Material-UI fallback for complex usage

### Migration Progress

View real-time migration statistics using the development dashboard:

1. Enable `MigrationProvider` in your app root
2. Click the floating action button to open the dashboard
3. View component-level migration progress and recommendations

## 🧪 Testing

### Test Structure

```bash
__tests__/
├── components/           # Component unit tests
├── integration/         # Integration tests
├── services/           # Service layer tests
└── utils/             # Utility function tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run migration-specific tests
npm test -- --testNamePattern="migration"
```

### Testing Migration Components

The migration layer includes comprehensive test coverage:

```typescript
// Test both migration and fallback paths
describe('Button Migration', () => {
  it('uses design system for simple props', () => {
    render(<Button variant="contained">Click Me</Button>);
    // Verify design system Button is used
  });

  it('falls back to Material-UI for complex props', () => {
    render(<Button sx={{ mt: 2 }} component="a">Link</Button>);
    // Verify Material-UI Button is used
  });
});
```

## 🔧 Development Tools

### Migration Dashboard

Development-only dashboard providing:

- Real-time migration progress tracking
- Component-level usage statistics
- Migration warnings and recommendations
- High-priority component identification

### ESLint Configuration

Automated enforcement of migration patterns:

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@mui/material',
            message:
              'Import from @/components/migration instead for better compatibility.',
          },
        ],
      },
    ],
  },
};
```

## 🚀 Deployment

### Environment Configuration

```bash
# Development
NODE_ENV=development
ENABLE_MIGRATION_TRACKING=true

# Production
NODE_ENV=production
ENABLE_MIGRATION_TRACKING=false  # Automatically disabled in production
```

### Build Process

The build process automatically:

- Excludes migration tracking code from production bundles
- Optimizes component imports for tree-shaking
- Validates ESLint rules requiring migration layer usage

## 📊 Performance

### Bundle Impact

- **Development**: Full migration layer (~15KB gzipped)
- **Production**: Zero overhead (tracking code stripped)
- **Component Overhead**: <0.1ms per component render

### Optimization Strategies

1. **Tree Shaking**: Import only needed migration adapters
2. **Code Splitting**: Dashboard components loaded on-demand
3. **Production Stripping**: All tracking code removed via build process

## 🤝 Contributing

### Migration Guidelines

When adding new components or migrating existing ones:

1. **Use Migration Layer**: Import from `@/components/migration` instead of Material-UI
2. **Follow Review Checklist**: Use [Migration Code Review Checklist](./MIGRATION_CODE_REVIEW_CHECKLIST.md)
3. **Test Both Paths**: Ensure design system and fallback paths work
4. **Update Documentation**: Include migration notes in PR descriptions

### Code Review Process

1. **Enable Migration Dashboard**: Review migration impact
2. **Check Import Strategy**: Verify migration layer usage
3. **Test Functionality**: Validate both component paths
4. **Performance Review**: Ensure no regressions
5. **Documentation**: Update relevant guides and references

## 🆘 Troubleshooting

### Common Issues

**Migration Dashboard Not Showing**

```typescript
// Ensure MigrationProvider is configured
<MigrationProvider showDashboard={true}>
  <App />
</MigrationProvider>
```

**TypeScript Errors with Props**

```typescript
// Migration adapters handle prop conversion automatically
import { Button } from '@/components/migration'; // Auto-converts size props
```

**Material-UI Specific Props Not Working**

```typescript
// Complex props automatically trigger Material-UI fallback
<Button sx={{ mt: 2 }} /> // Automatically uses Material-UI
```

### Getting Help

1. **Check Migration Guide**: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
2. **Review API Documentation**: [MIGRATION_API_REFERENCE.md](./MIGRATION_API_REFERENCE.md)
3. **Enable Dashboard Warnings**: View migration suggestions in development
4. **Check Console**: Development warnings provide guidance

## 📄 License

[Your License Here]

---

## 🎯 Migration Goals

### Phase 1: Foundation ✅

- Migration layer implementation
- Component adapters (Button, TextField, Select, FormControl, Checkbox, Radio)
- Basic tracking and fallback systems

### Phase 2: Enhancement ✅

- Migration dashboard with real-time tracking
- Development warnings and guidance
- Comprehensive documentation and code review processes

### Phase 3: Adoption (In Progress)

- Team training on migration patterns
- Progressive component conversion
- Performance optimization and bundle analysis

### Phase 4: Completion (Future)

- 80%+ migration rate achievement
- Material-UI dependency reduction
- Design system graduation and migration layer deprecation

---

For detailed migration information, please refer to the comprehensive documentation in the links above.
