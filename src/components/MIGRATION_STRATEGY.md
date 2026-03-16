# V2 Workflow Component Mapping Strategy

## Overview

This document outlines the strategy for mapping existing V2 workflow components to the new design system. The goal is to systematically migrate components to use unified design patterns while maintaining functionality and improving consistency.

## Component Analysis

### Current V2 Component Categories

#### 1. **Staff Workflow Components**

- **PackageApproval** - Complex approval interface with forms, dialogs, tables
- **CommentThread** - Discussion threads with real-time updates
- **InteractiveRedactionEditor** - Canvas-based redaction tools
- **AuditPanel** - Event tracking and audit trails
- **RecordReviewWorkspace** - Multi-panel review interface
- **BatchProcessingSystem** - Bulk operation management

#### 2. **Enhanced Search Components**

- **AISearchChat** - Conversational search interface
- **ChatWidget** - Floating chat component
- **AdvancedSearchInterface** - Complex search forms

#### 3. **Shared Components**

- **FileUpload** - File handling with drag-drop
- **DateRangePicker** - Date selection component
- **PIIFindings** - Privacy information display
- **AIDecisionTransparency** - AI explanation interface
- **AgencySwitcher** - Multi-agency selection

#### 4. **Layout Components**

- **AdminLayout** - Administrative interface layout
- **PublicLayout** - Public-facing layout
- **BaseLayout** - Common layout foundation

## Migration Strategy

### Phase 1: Foundation Component Integration ✅ COMPLETED

- Design system tokens and base components (Button, Input, Card)
- Storybook documentation and testing infrastructure
- Migration guidelines and best practices

### Phase 2: Component Mapping & Migration Planning 🎯 IN PROGRESS

#### 2.1 High-Priority Components (Week 1-2)

**Target: Form and Input Components**

- **FileUpload** → Design System Button + Card + Input patterns
- **DateRangePicker** → Design System Input with enhanced date handling
- **AgencySwitcher** → Design System Input (select variant)

**Migration Approach:**

```tsx
// OLD: Custom styled components
const DropZone = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  // ... custom styles
}));

// NEW: Design system patterns
<Card variant='outlined' {...dropProps}>
  <CardContent>
    <Button variant='outline' startIcon={<CloudUploadIcon />} size='lg'>
      Upload Files
    </Button>
  </CardContent>
</Card>;
```

#### 2.2 Medium-Priority Components (Week 3-4)

**Target: Display and Feedback Components**

- **AIDecisionTransparency** → Design System Card + Button patterns
- **PIIFindings** → Design System Card with alert variants
- **CommentThread** → Design System Card + Input + Button integration

**Migration Benefits:**

- Consistent spacing and typography
- Unified interaction patterns
- Improved accessibility compliance
- Streamlined maintenance

#### 2.3 Complex Components (Week 5-6)

**Target: Workflow Management Components**

- **PackageApproval** → Design System Card + Button + Input + Table patterns
- **RecordReviewWorkspace** → Layout system with design components
- **BatchProcessingSystem** → Design System form patterns

**Integration Strategy:**

```tsx
// Example: PackageApproval migration
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardContent,
} from '@/components/design-system';

const PackageApprovalCard = () => (
  <Card variant='outlined'>
    <CardHeader title='Package Approval' subtitle={`Request: ${requestId}`} />
    <CardContent>
      <Input
        label='Decision'
        state={hasError ? 'error' : 'default'}
        helperText='Select approval status'
      />
      <Button variant='success' onClick={handleApprove}>
        Approve Package
      </Button>
    </CardContent>
  </Card>
);
```

### Phase 3: Advanced Pattern Integration (Week 7-8)

#### 3.1 Layout System Migration

- **AdminLayout** → Design system layout patterns
- **BaseLayout** → Unified navigation and structure
- **PublicLayout** → Consistent public interface

#### 3.2 Interactive Components

- **InteractiveRedactionEditor** → Canvas integration with design system controls
- **AISearchChat** → Design system chat patterns
- **ChatWidget** → Floating component with design system styling

## Component Mapping Reference

### Button Mappings

```tsx
// OLD → NEW Mappings
<Button color="primary" variant="contained" />
→ <Button variant="primary" />

<Button color="secondary" variant="outlined" />
→ <Button variant="outline" />

<IconButton color="error" />
→ <Button variant="danger" startIcon={<DeleteIcon />} size="sm" />
```

### Input Mappings

```tsx
// OLD → NEW Mappings
<TextField variant="outlined" error helperText="Error" />
→ <Input variant="outlined" state="error" helperText="Error" />

<Select fullWidth />
→ <Input type="select" fullWidth />

<TextField multiline rows={4} />
→ <Input multiline rows={4} />
```

### Card Mappings

```tsx
// OLD → NEW Mappings
<Paper elevation={1} />
→ <Card variant="default" />

<Paper variant="outlined" />
→ <Card variant="outlined" />

<Card raised />
→ <Card variant="elevated" />
```

## Migration Implementation Plan

### Step 1: Create Component Adapters

Create transitional components that wrap design system components with legacy APIs:

```tsx
// src/components/migration/LegacyButton.tsx
import { Button as DesignButton } from '@/components/design-system';

export const Button = ({ color, variant, ...props }) => {
  const designVariant = mapLegacyVariant(color, variant);
  return <DesignButton variant={designVariant} {...props} />;
};
```

### Step 2: Progressive Migration

- Update one component at a time
- Maintain backward compatibility during transition
- Update tests to use new component patterns
- Document changes in component stories

### Step 3: Legacy Cleanup

- Remove old styled components
- Update imports throughout codebase
- Clean up unused dependencies
- Update documentation

## Testing Strategy

### Component-Level Testing

- Ensure design system components work in existing contexts
- Validate accessibility improvements
- Test responsive behavior
- Verify interaction patterns

### Integration Testing

- Test component interactions within workflows
- Validate form submission flows
- Ensure data handling remains intact
- Test error handling patterns

### Visual Regression Testing

- Use Storybook for visual testing
- Compare before/after screenshots
- Validate consistent styling
- Test responsive layouts

## Benefits of Migration

### Consistency

- Unified visual language across all components
- Consistent interaction patterns
- Standardized spacing and typography
- Cohesive color and theme usage

### Accessibility

- WCAG 2.1 AA compliance built-in
- Consistent keyboard navigation
- Proper ARIA attributes
- Screen reader optimization

### Developer Experience

- Reduced code duplication
- Easier component discovery
- Better TypeScript support
- Comprehensive documentation

### Maintenance

- Single source of truth for styling
- Easier design system updates
- Simplified component testing
- Reduced bundle size

## Success Metrics

### Technical Metrics

- **Code Reduction**: 30% reduction in component-specific styling code
- **Bundle Size**: 15% reduction in CSS bundle size
- **Test Coverage**: Maintain 90%+ test coverage throughout migration
- **Performance**: No regression in component render times

### User Experience Metrics

- **Accessibility Score**: 95%+ Lighthouse accessibility score
- **Consistency Score**: 100% design system pattern adoption
- **Developer Velocity**: 25% faster component development
- **Bug Reduction**: 40% fewer UI-related bugs

## Timeline

### Week 1-2: Foundation Setup

- [ ] Create component mapping documentation
- [ ] Set up migration testing infrastructure
- [ ] Create adapter components for smooth transition

### Week 3-4: High-Priority Migration

- [ ] Migrate FileUpload, DateRangePicker, AgencySwitcher
- [ ] Update associated tests and stories
- [ ] Document migration patterns

### Week 5-6: Medium-Priority Migration

- [ ] Migrate AIDecisionTransparency, PIIFindings, CommentThread
- [ ] Integration testing with existing workflows
- [ ] Performance validation

### Week 7-8: Complex Component Migration

- [ ] Migrate PackageApproval, RecordReviewWorkspace
- [ ] Layout system integration
- [ ] Complete testing and documentation

### Week 9: Cleanup & Optimization

- [ ] Remove legacy components and styles
- [ ] Final performance optimization
- [ ] Documentation completion
- [ ] Team training on new patterns

## Next Actions

1. **Create Migration Infrastructure** - Set up tooling and adapters
2. **Begin High-Priority Migrations** - Start with simple form components
3. **Establish Testing Patterns** - Define testing approach for migrated components
4. **Document Progress** - Track migration status and learnings
5. **Gather Team Feedback** - Collect developer experience insights

This migration strategy ensures systematic adoption of the design system while maintaining functionality and improving the overall user experience across the V2 workflow.
