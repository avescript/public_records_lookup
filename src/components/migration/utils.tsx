/**
 * Migration Utilities for V2 Component Integration
 *
 * Provides utility functions, hooks, and tools to support the migration
 * from legacy Material-UI components to the new design system.
 */

import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';

// Migration tracking and logging
export interface MigrationWarning {
  component: string;
  deprecatedProp: string;
  replacement: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

// Global migration state
const migrationState = {
  warnings: [] as MigrationWarning[],
  enableLogging: process.env.NODE_ENV === 'development',
  enableWarnings: true,
};

/**
 * Hook to track component migration status
 */
export const useMigrationTracking = (
  componentName: string,
  version: '1.0' | '2.0' = '1.0'
) => {
  const mountRef = useRef(false);

  useEffect(() => {
    if (!mountRef.current && migrationState.enableLogging) {
      console.log(`[Migration] ${componentName} (${version}) mounted`);
      mountRef.current = true;
    }
  }, [componentName, version]);

  const logWarning = (warning: Omit<MigrationWarning, 'component'>) => {
    if (!migrationState.enableWarnings) return;

    const fullWarning: MigrationWarning = {
      component: componentName,
      ...warning,
    };

    migrationState.warnings.push(fullWarning);

    if (migrationState.enableLogging) {
      const severity =
        warning.severity === 'high'
          ? 'error'
          : warning.severity === 'medium'
            ? 'warn'
            : 'log';
      console[severity](
        `[Migration Warning] ${componentName}: ${warning.message}`
      );
    }
  };

  return { logWarning };
};

/**
 * Prop migration utility
 * Helps map legacy props to new design system props
 */
export const migrateProp = <T,>(
  componentName: string,
  propName: string,
  value: T,
  migrationMap: Record<string, any>,
  defaultValue?: T
): T => {
  if (value !== undefined && migrationMap[propName]) {
    const mapping = migrationMap[propName];

    if (typeof mapping === 'function') {
      return mapping(value);
    }

    if (typeof mapping === 'object' && mapping[value as any]) {
      // Log migration warning in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[Migration] ${componentName}: Prop "${propName}=${value}" is deprecated. Use "${mapping[value as any]}" instead.`
        );
      }
      return mapping[value as any];
    }

    if (typeof mapping === 'string') {
      // Log migration warning in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[Migration] ${componentName}: Prop "${propName}" is deprecated. ${mapping}`
        );
      }
      return defaultValue ?? value;
    }
  }

  return value ?? defaultValue;
};

/**
 * Component wrapper to handle prop migrations automatically
 */
export const withMigration = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  componentName: string,
  propMigrations: Record<string, any> = {}
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const { logWarning } = useMigrationTracking(componentName);
    const migratedProps = { ...props };

    // Apply prop migrations
    Object.keys(propMigrations).forEach(propName => {
      if (props[propName] !== undefined) {
        const migration = propMigrations[propName];

        if (typeof migration === 'function') {
          migratedProps[propName] = migration(props[propName]);
        } else if (typeof migration === 'object') {
          const mappedValue = migration[props[propName]];
          if (mappedValue !== undefined) {
            migratedProps[propName] = mappedValue;
            logWarning({
              deprecatedProp: propName,
              replacement: `${propName}="${mappedValue}"`,
              severity: 'low',
              message: `Prop value "${propName}=${props[propName]}" automatically migrated to "${mappedValue}"`,
            });
          }
        }
      }
    });

    return <Component ref={ref} {...migratedProps} />;
  });

  WrappedComponent.displayName = `withMigration(${componentName})`;
  return WrappedComponent;
};

/**
 * Validation utility for component props
 */
export const validateMigration = (
  componentName: string,
  props: Record<string, any>,
  validations: Record<string, (value: any) => boolean | string>
) => {
  Object.keys(validations).forEach(propName => {
    const value = props[propName];
    const validation = validations[propName];

    if (value !== undefined) {
      const result = validation(value);

      if (result !== true && process.env.NODE_ENV === 'development') {
        const message =
          typeof result === 'string'
            ? `Invalid prop "${propName}": ${result}`
            : `Invalid prop value for "${propName}"`;
        console.error(`[Migration] ${componentName}: ${message}`);
      }
    }
  });
};

/**
 * Hook to get migration warnings and statistics
 */
export const useMigrationStats = () => {
  const [warnings, setWarnings] = useState<MigrationWarning[]>([]);

  useEffect(() => {
    setWarnings([...migrationState.warnings]);
  }, []);

  const stats = {
    total: warnings.length,
    high: warnings.filter(w => w.severity === 'high').length,
    medium: warnings.filter(w => w.severity === 'medium').length,
    low: warnings.filter(w => w.severity === 'low').length,
    byComponent: warnings.reduce(
      (acc, warning) => {
        acc[warning.component] = (acc[warning.component] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };

  return { warnings, stats };
};

/**
 * Development tool component for migration tracking
 * Only renders in development mode
 */
export const MigrationDashboard: React.FC = () => {
  const { warnings, stats } = useMigrationStats();

  if (process.env.NODE_ENV !== 'development' || !migrationState.enableLogging) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 9999,
        maxWidth: '300px',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
        Migration Status
      </h3>
      <div>Total Warnings: {stats.total}</div>
      <div style={{ color: '#ff4444' }}>High: {stats.high}</div>
      <div style={{ color: '#ff8800' }}>Medium: {stats.medium}</div>
      <div style={{ color: '#ffff00' }}>Low: {stats.low}</div>

      {Object.keys(stats.byComponent).length > 0 && (
        <>
          <h4 style={{ margin: '12px 0 8px 0', fontSize: '12px' }}>
            By Component:
          </h4>
          {Object.entries(stats.byComponent).map(([component, count]) => (
            <div key={component}>
              {component}: {count}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

/**
 * Migration configuration
 */
export const migrationConfig = {
  enableLogging: (enabled: boolean) => {
    migrationState.enableLogging = enabled;
  },
  enableWarnings: (enabled: boolean) => {
    migrationState.enableWarnings = enabled;
  },
  clearWarnings: () => {
    migrationState.warnings = [];
  },
  getWarnings: () => [...migrationState.warnings],
};

// Export commonly used migration patterns
export const migrationPatterns = {
  // Button migrations
  buttonColor: {
    primary: 'primary',
    secondary: 'secondary',
    error: 'danger',
    success: 'success',
    info: 'primary',
    warning: 'warning',
  },
  buttonVariant: {
    text: 'ghost',
    outlined: 'outline',
    contained: (color: string) => color || 'primary',
  },

  // Input migrations
  textFieldVariant: {
    standard: 'standard',
    filled: 'filled',
    outlined: 'outlined',
  },
  textFieldState: (error: boolean) => (error ? 'error' : 'default'),

  // Paper migrations
  paperVariant: {
    elevation: (elevation: number) => (elevation > 2 ? 'elevated' : 'default'),
    outlined: 'outlined',
  },
};
