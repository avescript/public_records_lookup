/**
 * Migration Infrastructure for V2 Component Integration
 *
 * This module provides all the necessary tools, adapters, and utilities
 * to support gradual migration from legacy Material-UI components
 * to the new design system.
 *
 * Usage:
 * 1. Use adapters for drop-in replacements: import { Button } from '@/components/migration'
 * 2. Use utilities for custom migrations: import { migrateProp, withMigration } from '@/components/migration'
 * 3. Use tracking in development: import { MigrationDashboard } from '@/components/migration'
 */

// Legacy component adapters
export {
  Button,
  Card,
  getMigrationMapping,
  type LegacyButtonProps,
  type LegacyPaperProps,
  type LegacySelectProps,
  type LegacyTextFieldProps,
  Paper,
  Select,
  TextField,
} from './adapters';

// Migration utilities and tools
export {
  migrateProp,
  migrationConfig,
  MigrationDashboard,
  migrationPatterns,
  type MigrationWarning,
  useMigrationStats,
  useMigrationTracking,
  validateMigration,
  withMigration,
} from './utils';

// Re-export design system components for convenience
export {
  Button as DesignButton,
  Card as DesignCard,
  Input as DesignInput,
  Select as DesignSelect,
} from '@/components/design-system';

/**
 * Migration Guide
 *
 * Phase 1: Drop-in Replacement
 * Replace Material-UI imports with migration adapters:
 *
 * Before:
 * import { Button, TextField, Paper, Select, MenuItem } from '@mui/material';
 *
 * After:
 * import { Button, TextField, Paper, Select } from '@/components/migration';
 *
 * Phase 2: Gradual Migration
 * Update component usage to use design system props:
 *
 * Before:
 * <Button color="primary" variant="contained">Click me</Button>
 * <Select displayEmpty>
 *   <MenuItem value="dept1">Department 1</MenuItem>
 * </Select>
 *
 * After:
 * <Button variant="primary">Click me</Button>
 * <Select options={[{value: 'dept1', label: 'Department 1'}]}
 *         placeholder="Select department..." />
 *
 * Phase 3: Full Migration
 * Import directly from design system:
 *
 * Final:
 * import { Button, Select } from '@/components/design-system';
 * <Button variant="primary">Click me</Button>
 */

export const migrationGuide = {
  phase1: 'Drop-in replacement with adapters',
  phase2: 'Gradual prop migration',
  phase3: 'Full design system adoption',

  getPhaseInstructions: (phase: 1 | 2 | 3) => {
    switch (phase) {
      case 1:
        return {
          title: 'Phase 1: Drop-in Replacement',
          description:
            'Replace Material-UI imports with migration adapters for immediate compatibility',
          steps: [
            'Change import from @mui/material to @/components/migration',
            'No prop changes needed - adapters handle legacy props',
            'Test components render correctly',
            'Enable migration dashboard in development',
          ],
        };
      case 2:
        return {
          title: 'Phase 2: Gradual Migration',
          description: 'Update component props to use design system patterns',
          steps: [
            'Review migration warnings in development console',
            'Update props using migration mapping guide',
            'Test component functionality and styling',
            'Validate accessibility improvements',
          ],
        };
      case 3:
        return {
          title: 'Phase 3: Full Migration',
          description: 'Complete transition to design system components',
          steps: [
            'Change imports to use design system directly',
            'Remove any remaining legacy props',
            'Update TypeScript types if needed',
            'Remove migration adapters from component',
          ],
        };
      default:
        return null;
    }
  },
};
