# Design System Documentation

## Overview

The Public Records Application Design System provides a comprehensive set of reusable components, design tokens, and guidelines to ensure consistency and accessibility across the application. Built on Material-UI with custom design tokens, it offers a cohesive user experience while maintaining flexibility for complex workflows.

## Getting Started

### Installation & Setup

The design system is already integrated into the project. To use components in your code:

```tsx
import { Button, Input, Card } from '@/components/design-system';
```

### Design Tokens

All components use design tokens for consistent styling. Import tokens when needed:

```tsx
import {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
} from '@/theme/design-system/tokens';
```

## Components

### Button Component

Accessible button component with multiple variants, states, and sizes.

#### Basic Usage

```tsx
import { Button } from '@/components/design-system';

// Basic button
<Button onClick={handleClick}>Click Me</Button>

// Primary button with icon
<Button variant="primary" startIcon={<SaveIcon />}>
  Save Document
</Button>
```

#### Variants

- **primary** - Main action buttons (default)
- **secondary** - Secondary actions
- **outline** - Outlined style for subtle actions
- **ghost** - Minimal style for less prominent actions
- **danger** - Destructive actions (delete, remove)
- **success** - Positive actions (approve, confirm)
- **AI** - AI-specific actions with special styling

#### Sizes

- **sm** - Small buttons for compact layouts
- **md** - Medium buttons (default)
- **lg** - Large buttons for prominent actions

#### States

- **loading** - Shows spinner, disables interaction
- **disabled** - Disabled state with appropriate styling
- **fullWidth** - Expands to full container width

#### Best Practices

✅ **Do:**

- Use primary for main actions (submit, save, continue)
- Use secondary for supporting actions (cancel, back)
- Use danger for destructive actions with confirmation
- Include aria-label for icon-only buttons
- Use loading state for async operations

❌ **Don't:**

- Use multiple primary buttons in the same context
- Use danger variant without confirmation dialogs
- Disable buttons without explaining why
- Use very long text that wraps to multiple lines

#### Accessibility Features

- Full keyboard navigation support
- Screen reader compatible with proper ARIA attributes
- Focus indicators meet WCAG guidelines
- Disabled state properly announced to assistive technologies

### Input Component

Comprehensive input component with validation states, character counting, and icon support.

#### Basic Usage

```tsx
import { Input } from '@/components/design-system';

// Basic input
<Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
/>

// Input with validation
<Input
  label="Username"
  state="error"
  helperText="Username is required"
  startIcon={<PersonIcon />}
/>
```

#### Variants

- **outlined** - Outlined border (default)
- **filled** - Filled background style
- **standard** - Underline style

#### States

- **default** - Normal state
- **error** - Error state with red styling
- **warning** - Warning state with orange styling
- **success** - Success state with green styling

#### Features

- **Character Count** - Shows current/max characters
- **Icon Support** - Start and end icon positions
- **Multiline** - Textarea functionality
- **Validation** - Built-in validation state handling

#### Best Practices

✅ **Do:**

- Provide clear, descriptive labels
- Use helper text for guidance and errors
- Show character count for limited inputs
- Use appropriate input types (email, password, etc.)
- Provide immediate feedback for validation

❌ **Don't:**

- Use placeholder text as the only label
- Show errors before user has finished typing
- Use very small character limits without warning
- Overwhelm with too many validation messages

### Card Component

Flexible container component with variants and sub-components for organizing content.

#### Basic Usage

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/design-system';

// Simple card
<Card>
  <CardContent>
    <h3>Card Title</h3>
    <p>Card content goes here.</p>
  </CardContent>
</Card>

// Full card with header and footer
<Card variant="outlined">
  <CardHeader
    title="Request Details"
    subtitle="Public Records Request #12345"
    action={<MoreVertIcon />}
  />
  <CardContent>
    <p>Request submitted on January 15, 2026</p>
  </CardContent>
  <CardFooter>
    <Button variant="outline">View Details</Button>
    <Button variant="primary">Process Request</Button>
  </CardFooter>
</Card>
```

#### Variants

- **default** - Standard card with subtle shadow
- **outlined** - Card with border, no shadow
- **elevated** - Card with prominent shadow
- **interactive** - Clickable card with hover effects
- **AI** - Special styling for AI-related content

#### Sub-components

- **CardHeader** - Title, subtitle, and action area
- **CardContent** - Main content area with proper spacing
- **CardFooter** - Action buttons and footer content

#### Best Practices

✅ **Do:**

- Use cards to group related information
- Provide clear hierarchy with headers
- Use interactive variant for clickable cards
- Keep content scannable and well-organized

❌ **Don't:**

- Nest cards deeply (max 2 levels)
- Make cards too wide on large screens
- Use cards for simple text blocks
- Overcrowd with too much information

## Design Tokens

### Colors

The design system includes comprehensive color palettes:

- **Primary** - Main brand colors (blue scale)
- **Secondary** - Supporting colors (purple scale)
- **Success** - Positive actions and states (green scale)
- **Warning** - Caution and attention (orange scale)
- **Error** - Negative actions and errors (red scale)
- **Neutral** - Grayscale for text and backgrounds
- **AI** - Special purple scale for AI features

#### Usage

```tsx
import { colors } from '@/theme/design-system/tokens';

// Use in styled components
const StyledDiv = styled.div`
  background-color: ${colors.primary[50]};
  border: 1px solid ${colors.primary[200]};
  color: ${colors.primary[700]};
`;
```

### Typography

Typography system includes:

- **Font Families**: Primary (system fonts), Secondary (display), Mono (code)
- **Font Sizes**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl
- **Font Weights**: light, regular, medium, semibold, bold
- **Line Heights**: Optimized for readability

### Spacing

Consistent spacing scale from 0.125rem to 16rem:

- Use for margins, padding, and layout spacing
- Based on 0.25rem (4px) increments
- Follows standard spacing conventions

### Shadows

Elevation system with 5 shadow levels:

- **xs** - Subtle elevation
- **sm** - Light elevation
- **md** - Standard elevation
- **lg** - Prominent elevation
- **xl** - Maximum elevation

## Accessibility Guidelines

### WCAG Compliance

All components meet WCAG 2.1 AA standards:

- **Color Contrast** - Minimum 4.5:1 ratio for normal text
- **Keyboard Navigation** - All interactive elements accessible via keyboard
- **Screen Readers** - Proper ARIA labels and semantic markup
- **Focus Indicators** - Clear visual focus indicators

### Implementation Guidelines

1. **Always provide labels** for form controls
2. **Use semantic HTML** elements when possible
3. **Include alt text** for images and icons
4. **Provide clear error messages** with instructions
5. **Test with keyboard navigation** and screen readers

## Migration Guide

### From Existing Components

When migrating from existing V2 components to the design system:

#### 1. Identify Component Mappings

```tsx
// OLD: Custom button component
<CustomButton type="primary" onClick={handleSave}>
  Save
</CustomButton>

// NEW: Design system button
<Button variant="primary" onClick={handleSave}>
  Save
</Button>
```

#### 2. Update Styling Approach

```tsx
// OLD: Inline styles or custom CSS
<div style={{ color: '#3B82F6', padding: '16px' }}>
  Content
</div>

// NEW: Design tokens
<div style={{
  color: colors.primary[500],
  padding: spacing[4]
}}>
  Content
</div>
```

#### 3. Implement Accessibility Features

```tsx
// OLD: Basic button
<button onClick={handleDelete}>Delete</button>

// NEW: Accessible button with proper ARIA
<Button
  variant="danger"
  onClick={handleDelete}
  aria-label="Delete document permanently"
>
  Delete
</Button>
```

### Migration Checklist

- [ ] Replace custom components with design system equivalents
- [ ] Update color usage to use design tokens
- [ ] Implement proper accessibility attributes
- [ ] Test with keyboard navigation
- [ ] Validate with accessibility tools
- [ ] Update tests to use new component APIs

## Development Workflow

### Adding New Components

When adding new components to the design system:

1. **Create component file** in `/src/components/design-system/`
2. **Use design tokens** for all styling
3. **Implement accessibility** features
4. **Create comprehensive tests** with high coverage
5. **Add Storybook stories** with examples
6. **Update exports** in `index.ts`
7. **Document usage** in this guide

### Testing Requirements

- **Unit Tests** - Test component behavior and props
- **Accessibility Tests** - Validate ARIA attributes and keyboard navigation
- **Visual Tests** - Test appearance across variants and states
- **Integration Tests** - Test component interactions

### Code Standards

- **TypeScript** - All components must be fully typed
- **ESLint** - Follow project linting rules
- **Prettier** - Consistent code formatting
- **Props Interface** - Document all props with JSDoc comments

## Storybook Integration

Access interactive component documentation at `http://localhost:6006` when running:

```bash
npm run storybook
```

### Story Organization

- **Design System/Button** - All button variants and examples
- **Design System/Input** - Input component with all features
- **Design System/Card** - Card variants and complex examples
- **Design System/Tokens** - Visual guide to design tokens

### Accessibility Testing

Storybook includes automatic accessibility testing:

- Violations are shown in the "Accessibility" panel
- Tests run automatically when viewing components
- Use for validation during development

## Best Practices Summary

### Component Design

1. **Consistency** - Use design tokens for all styling
2. **Flexibility** - Support multiple variants and sizes
3. **Accessibility** - Built-in WCAG compliance
4. **Performance** - Optimized for tree-shaking and bundle size

### Usage Guidelines

1. **Semantic HTML** - Use appropriate HTML elements
2. **Progressive Enhancement** - Work without JavaScript
3. **Responsive Design** - Adapt to different screen sizes
4. **Error Handling** - Graceful degradation for edge cases

### Testing Strategy

1. **Unit Tests** - Test component logic and props
2. **Integration Tests** - Test component interactions
3. **Visual Tests** - Catch styling regressions
4. **Accessibility Tests** - Validate a11y compliance

## Support and Resources

- **Storybook** - Interactive component documentation
- **Design Tokens** - Complete token reference
- **Accessibility Guidelines** - WCAG compliance details
- **Migration Guide** - Step-by-step component migration
- **Testing Patterns** - Component testing examples

For questions or contributions to the design system, refer to the project's development guidelines and accessibility standards.
