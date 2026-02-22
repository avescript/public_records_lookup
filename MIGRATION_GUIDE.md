# Migration Documentation & Guidelines

**Epic V2-7 Phase 6: Priority 3 Task 6 - Migration Documentation**

## Overview

This documentation provides comprehensive guidelines for migrating from Material-UI components to our design system through the migration layer. The migration layer ensures backward compatibility while enabling gradual adoption of the new design system.

## Quick Start

### 1. Basic Component Migration

Replace direct Material-UI imports with migration layer imports:

```typescript
// ❌ Before: Direct Material-UI usage
import { Button, TextField, Select } from '@mui/material';

// ✅ After: Migration layer usage
import { Button, TextField, Select } from '@/components/migration';
```

### 2. Enable Migration Dashboard (Development)

Add the MigrationProvider to your app root:

```typescript
// In your main app component or layout
import { MigrationProvider } from '@/components/migration';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <MigrationProvider showDashboard={true}>
          {children}
        </MigrationProvider>
      </body>
    </html>
  );
}
```

## Migration Layer Components

### Button Migration

The Button migration adapter supports all Material-UI Button props with smart fallback to Material-UI for complex usage:

```typescript
// ✅ Simple usage - uses design system
<Button variant="contained" color="primary" size="large">
  Click Me
</Button>

// ✅ Complex usage - automatically falls back to Material-UI
<Button
  component="a"
  href="/dashboard"
  sx={{ mt: 2 }}
  startIcon={<SaveIcon />}
>
  Save & Continue
</Button>
```

**Prop Mapping:**

- `size`: `'small' | 'medium' | 'large'` → `'sm' | 'md' | 'lg'`
- `variant`: `'contained' | 'outlined' | 'text'` → `'primary' | 'outline' | 'ghost'`
- `color`: `'primary' | 'secondary' | 'success' | 'error'` → design system variants
- `startIcon/endIcon` → `leftIcon/rightIcon` (design system)

### TextField Migration

TextField adapter maintains full Material-UI compatibility:

```typescript
// ✅ Standard usage
<TextField
  label="Email Address"
  type="email"
  variant="outlined"
  fullWidth
  required
  error={!!errors.email}
  helperText={errors.email?.message}
/>

// ✅ Advanced usage with validation
<TextField
  label="Password"
  type="password"
  variant="outlined"
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        <IconButton onClick={toggleShowPassword}>
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </InputAdornment>
    ),
  }}
/>
```

### Select Migration

Select adapter handles both options prop and MenuItem children patterns:

```typescript
// ✅ Options prop pattern (recommended)
<Select
  label="Department"
  value={department}
  onChange={(e) => setDepartment(e.target.value)}
  options={[
    { value: 'hr', label: 'Human Resources' },
    { value: 'it', label: 'Information Technology' },
    { value: 'legal', label: 'Legal Affairs' }
  ]}
/>

// ✅ MenuItem children pattern (legacy compatibility)
<Select
  label="Status"
  value={status}
  onChange={(e) => setStatus(e.target.value)}
>
  <MenuItem value="draft">Draft</MenuItem>
  <MenuItem value="review">Under Review</MenuItem>
  <MenuItem value="approved">Approved</MenuItem>
</Select>
```

### FormControl Migration

FormControl provides full Material-UI compatibility:

```typescript
// ✅ Standard form control wrapper
<FormControl fullWidth variant="outlined" error={!!errors.type}>
  <InputLabel>Request Type</InputLabel>
  <Select
    value={requestType}
    onChange={handleTypeChange}
    label="Request Type"
  >
    <MenuItem value="records">Public Records</MenuItem>
    <MenuItem value="documents">Document Request</MenuItem>
  </Select>
  {errors.type && (
    <FormHelperText>{errors.type.message}</FormHelperText>
  )}
</FormControl>
```

### Checkbox & Radio Migration

Checkbox and Radio components maintain Material-UI prop compatibility:

```typescript
// ✅ Checkbox usage
<FormControlLabel
  control={
    <Checkbox
      checked={agreedToTerms}
      onChange={(e) => setAgreedToTerms(e.target.checked)}
      color="primary"
    />
  }
  label="I agree to the terms and conditions"
/>

// ✅ Radio group usage
<RadioGroup
  value={selectedOption}
  onChange={(e) => setSelectedOption(e.target.value)}
>
  <FormControlLabel value="option1" control={<Radio />} label="Option 1" />
  <FormControlLabel value="option2" control={<Radio />} label="Option 2" />
</RadioGroup>
```

## Migration Tracking

### Development Dashboard

The migration dashboard provides real-time insights into component usage and migration progress:

- **Overall Progress**: Migration percentage across all components
- **Component Statistics**: Individual component migration vs legacy usage
- **High-Priority Components**: Critical components that should be migrated first
- **Warnings & Guidance**: Contextual suggestions for improving migration adoption

### Tracking Integration

Component usage is automatically tracked in development mode:

```typescript
// Automatic tracking in migration adapters
export const Button = ({ ...props }) => {
  useMigrationSuccess('Button'); // Automatically tracks usage
  // ... component logic
};

// Manual tracking for custom components
import {
  trackComponentUsage,
  addMigrationWarning,
} from '@/components/migration';

// Track legacy usage
trackComponentUsage('CustomButton', 'legacy', __filename);

// Add development warning
addMigrationWarning({
  severity: 'warning',
  message: 'Consider migrating CustomButton to design system',
  component: 'CustomButton',
  suggestion: 'Use Button from @/components/migration instead',
  actionRequired: false,
});
```

## Code Review Checklist

### ✅ Migration Requirements

**For New Components:**

- [ ] Use migration layer imports instead of direct Material-UI imports
- [ ] Handle complex props appropriately (sx, component, etc.)
- [ ] Include proper TypeScript types for all props
- [ ] Test both design system and Material-UI fallback paths

**For Existing Components:**

- [ ] Replace `@mui/material` imports with `@/components/migration`
- [ ] Verify all existing functionality is preserved
- [ ] Check that complex Material-UI props still work (sx, component, etc.)
- [ ] Ensure no visual regressions in component rendering

### ✅ Quality Standards

**Code Quality:**

- [ ] Follow existing code style and patterns
- [ ] Include JSDoc comments for complex prop mappings
- [ ] Handle edge cases and error states properly
- [ ] Maintain accessibility features (ARIA labels, keyboard navigation)

**Testing:**

- [ ] Existing tests continue to pass
- [ ] Migration adapter behavior is covered by tests
- [ ] Both design system and fallback paths are tested
- [ ] Accessibility requirements are validated

### ✅ Documentation

**Required Documentation:**

- [ ] Update component documentation with migration examples
- [ ] Include prop mapping tables for complex components
- [ ] Document any breaking changes or behavioral differences
- [ ] Add migration guidance to relevant README files

## Common Patterns

### 1. Conditional Migration

For components that may need gradual migration:

```typescript
// Conditional migration based on feature flag
const useDesignSystem = process.env.USE_DESIGN_SYSTEM === 'true';

const ButtonComponent = useDesignSystem ? DesignButton : MuiButton;
```

### 2. Complex Prop Handling

When dealing with complex Material-UI specific props:

```typescript
export const EnhancedComponent = ({ sx, component, ...props }) => {
  // Use Material-UI for complex props
  if (sx || component) {
    return <MuiComponent sx={sx} component={component} {...props} />;
  }

  // Use design system for simple props
  return <DesignComponent {...props} />;
};
```

### 3. Progressive Enhancement

Start with high-impact, low-risk components:

1. **Priority 1**: Button, TextField, Select (form components)
2. **Priority 2**: Card, Paper (layout components)
3. **Priority 3**: Typography, IconButton (content components)
4. **Priority 4**: Complex components (DataGrid, AutoComplete)

## Troubleshooting

### Common Issues

**1. TypeScript Errors with Props**

```typescript
// ❌ Problem: Size prop type mismatch
<Button size="large" /> // Type error

// ✅ Solution: Migration adapter handles conversion
import { Button } from '@/components/migration'; // Auto-converts large → lg
```

**2. Material-UI Specific Props Not Working**

```typescript
// ❌ Problem: sx prop not recognized
<Button sx={{ mt: 2 }} /> // May not work with design system

// ✅ Solution: Migration adapter auto-detects and uses Material-UI
import { Button } from '@/components/migration'; // Automatically falls back
```

**3. Event Handler Differences**

```typescript
// ❌ Problem: onChange event structure differs
<Select onChange={(value) => setValue(value)} /> // Design system format

// ✅ Solution: Migration adapter normalizes events
<Select onChange={(e) => setValue(e.target.value)} /> // Material-UI format preserved
```

### Debugging Tips

1. **Enable Migration Dashboard**: Use the floating action button to see real-time migration statistics
2. **Check Console Warnings**: Development mode shows migration suggestions
3. **Verify Fallback Behavior**: Complex props should automatically use Material-UI
4. **Test in Both Modes**: Ensure components work with and without design system

## Performance Considerations

### Bundle Size Impact

The migration layer includes smart imports to minimize bundle impact:

```typescript
// ✅ Tree-shaking friendly imports
import { Button } from '@/components/migration'; // Only loads Button adapter

// ❌ Avoid importing entire migration layer
import * as Migration from '@/components/migration'; // Loads everything
```

### Development vs Production

- **Development**: Full tracking, dashboard, warnings enabled
- **Production**: Zero overhead - all tracking disabled, pure component rendering

### Memory Management

- Migration stats are limited to prevent memory leaks (max 50 warnings)
- Component tracking uses WeakMap for automatic garbage collection
- Dashboard auto-refreshes every 10 seconds to prevent stale data

## Best Practices

### 1. Start Small

Begin migration with leaf components (buttons, inputs) before tackling complex composite components.

### 2. Maintain Compatibility

Always ensure existing functionality works during migration. The migration layer should be invisible to users.

### 3. Use Dashboard Insights

Leverage the migration dashboard to identify high-impact components and track progress over time.

### 4. Test Thoroughly

Test both the design system path and Material-UI fallback path for each component.

### 5. Document Changes

Keep clear documentation of migration decisions, especially for complex components with custom behavior.

---

## Next Steps

After completing component migration:

1. **Review Dashboard Statistics**: Achieve 80%+ migration rate for high-priority components
2. **Update ESLint Rules**: Enhance rules to prevent direct Material-UI usage
3. **Bundle Analysis**: Evaluate bundle size impact and optimize imports
4. **Performance Testing**: Ensure migration doesn't impact application performance
5. **Team Training**: Share migration patterns and best practices with the development team

For questions or issues, refer to the migration dashboard warnings or consult this documentation.
