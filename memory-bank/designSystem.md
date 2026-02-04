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
      EnhancedDashboard/    # V2-1: Enhanced request management dashboard
        EnhancedDashboard.tsx
        DashboardFilters.tsx
        MetricsPanel.tsx
        BulkOperations.tsx
      RequestDetailsDrawer/ # V2-1: Enhanced request details interface
        SLAMonitoring.tsx
        RequesterContactInfo.tsx
        RequestTimeline.tsx
        AttachmentManager.tsx
      WorkflowNavigation/   # V2-1: Step-based navigation system
        WorkflowNavigation.tsx
        StepSummaryCards.tsx
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

## V2-1 Component Patterns

### Enhanced Request Management Components

The V2-1 epic introduced a comprehensive set of request management components following our design system principles:

#### 1. SLA Monitoring Component

```typescript
interface SLAMonitoringProps {
  request: StoredRequest;
  slaConfig?: SLAConfig;
  customDueDate?: Date;
}

// Features:
// - Real-time SLA tracking with visual progress indicators
// - Department-specific SLA configurations
// - Intelligent alerting (on-track, at-risk, overdue, completed)
// - Material-UI integration with consistent theming
```

**Design Tokens Used:**

- `theme.palette.primary` for progress indicators
- `theme.palette.error` for overdue status
- `theme.palette.warning` for at-risk status
- `theme.palette.success` for completed status
- `theme.spacing()` for consistent layout
- `theme.typography` for text hierarchy

#### 2. Requester Contact Info Component

```typescript
interface RequesterContactInfoProps {
  request: StoredRequest;
}

// Features:
// - Contact information processing and display
// - Request history tracking with mock data integration
// - Communication timeline with role-based attribution
// - Email domain analysis for contact type detection
```

**Design Patterns:**

- Card-based layout with elevation
- List-based information display
- Chip components for categorization
- Icon integration for visual hierarchy

#### 3. Request Timeline Component

```typescript
interface RequestTimelineProps {
  request: StoredRequest;
}

interface TimelineEvent {
  id: string;
  type:
    | 'submitted'
    | 'status_change'
    | 'comment'
    | 'view'
    | 'assignment'
    | 'match_found';
  title: string;
  description?: string;
  timestamp: Date;
  user?: UserInfo;
  metadata?: Record<string, any>;
}

// Features:
// - Chronological event display with avatars and icons
// - Event type categorization with consistent color coding
// - Relative and absolute time formatting
// - User attribution with role-based styling
```

**Accessibility Features:**

- ARIA labels for timeline navigation
- Semantic list structure
- Color-blind friendly status indicators
- Keyboard navigation support

#### 4. Attachment Manager Component

```typescript
interface AttachmentManagerProps {
  request: StoredRequest;
}

interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// Features:
// - File list display with expandable interface
// - File type detection and icon mapping
// - Preview functionality with modal dialogs
// - Upload interface with drag-and-drop support
// - Bulk operations (select all, download, delete)
// - File validation and error handling
```

**Component Composition:**

- Uses Card, List, Dialog, Button from core components
- Consistent spacing with `theme.spacing()`
- File type icons from Material-UI icon library
- Progress indicators for upload states

### Enhanced Dashboard Components

#### 1. Enhanced Dashboard

```typescript
// Features:
// - Real data integration with getAllRequests service
// - Dual view interface (card/table toggle)
// - Advanced filtering system integration
// - Real-time metrics panel
// - Bulk operations support
// - Priority calculation and visual indicators
```

#### 2. Dashboard Filters

```typescript
// Features:
// - Drawer-based filter interface
// - Multi-criteria filtering (status, priority, department, users, dates)
// - Filter state persistence
// - Clear all functionality with confirmation
// - Responsive design for mobile devices
```

#### 3. Metrics Panel

```typescript
// Features:
// - Real-time metrics calculation
// - Auto-refresh capabilities
// - Status distribution visualization
// - Overdue request tracking
// - Activity timeline integration
```

#### 4. Bulk Operations

```typescript
// Features:
// - Selection controls with "select all" functionality
// - Bulk status updates with confirmation dialogs
// - Assignment operations
// - Export functionality
// - Progress indicators for bulk actions
```

### Component Integration Patterns

```typescript
// Example: RequestDetailsDrawer integration
import {
  SLAMonitoring,
  RequesterContactInfo,
  RequestTimeline,
  AttachmentManager
} from '@/components/staff';

export function RequestDetailsDrawer({ request }: RequestDetailsDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose}>
      <SLAMonitoring request={request} />
      <RequesterContactInfo request={request} />
      <RequestTimeline request={request} />
      <AttachmentManager request={request} />
    </Drawer>
  );
}
```

### Design System Compliance

All V2-1 components follow our design system principles:

✅ **Material-UI Integration:** Uses MUI components as building blocks  
✅ **Theme Consistency:** Respects `theme.palette`, `theme.spacing`, `theme.typography`  
✅ **TypeScript Strict:** Full type safety with proper interfaces  
✅ **Accessibility:** ARIA labels, keyboard navigation, semantic HTML  
✅ **Responsive Design:** Mobile-first approach with breakpoint support  
✅ **Testing Coverage:** Comprehensive unit tests (99 tests across 4 components)  
✅ **Component Library:** Proper exports and shared library integration

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
