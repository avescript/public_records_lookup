/**
 * Migration Statistics Hook
 * Epic V2-7 Phase 5: Priority 3 Migration Tooling
 *
 * Provides real-time tracking of component migration adoption,
 * usage statistics, and development guidance for design system transition.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

// Migration tracking types
export interface ComponentUsageStats {
  componentName: string;
  migrationCount: number;
  legacyCount: number;
  migrationPercentage: number;
  lastUsed: Date;
  locations: string[];
}

export interface MigrationProgress {
  totalComponents: number;
  migratedComponents: number;
  overallPercentage: number;
  highPriorityRemaining: number;
  recentActivity: ComponentUsageStats[];
}

export interface MigrationWarning {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  component?: string;
  filePath?: string;
  suggestion?: string;
  actionRequired: boolean;
}

// Development-only migration tracking
interface MigrationTracker {
  stats: Map<string, ComponentUsageStats>;
  warnings: MigrationWarning[];
  isEnabled: boolean;
}

// Global migration tracker (development only)
const migrationTracker: MigrationTracker = {
  stats: new Map(),
  warnings: [],
  isEnabled: process.env.NODE_ENV === 'development',
};

/**
 * Track component usage for migration statistics
 */
export function trackComponentUsage(
  componentName: string,
  type: 'migration' | 'legacy',
  filePath?: string
): void {
  if (!migrationTracker.isEnabled) return;

  const existing = migrationTracker.stats.get(componentName) || {
    componentName,
    migrationCount: 0,
    legacyCount: 0,
    migrationPercentage: 0,
    lastUsed: new Date(),
    locations: [],
  };

  // Update counts
  if (type === 'migration') {
    existing.migrationCount += 1;
  } else {
    existing.legacyCount += 1;
  }

  // Calculate percentage
  const total = existing.migrationCount + existing.legacyCount;
  existing.migrationPercentage =
    total > 0 ? (existing.migrationCount / total) * 100 : 0;

  // Update metadata
  existing.lastUsed = new Date();
  if (filePath && !existing.locations.includes(filePath)) {
    existing.locations.push(filePath);
  }

  migrationTracker.stats.set(componentName, existing);
}

/**
 * Add migration warning for development guidance
 */
export function addMigrationWarning(
  warning: Omit<MigrationWarning, 'id'>
): void {
  if (!migrationTracker.isEnabled) return;

  const id = `${warning.component || 'global'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  migrationTracker.warnings.push({
    ...warning,
    id,
  });

  // Keep only last 50 warnings to prevent memory issues
  if (migrationTracker.warnings.length > 50) {
    migrationTracker.warnings = migrationTracker.warnings.slice(-50);
  }
}

/**
 * Migration Statistics Hook
 * Provides real-time component usage tracking and migration progress
 */
export function useMigrationStats(): {
  progress: MigrationProgress;
  componentStats: ComponentUsageStats[];
  warnings: MigrationWarning[];
  highPriorityComponents: string[];
  refreshStats: () => void;
  clearWarnings: () => void;
  isEnabled: boolean;
} {
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // High priority components that should be migrated first
  const highPriorityComponents = [
    'Button',
    'TextField',
    'Select',
    'FormControl',
    'Checkbox',
    'Radio',
    'Card',
    'Paper',
    'IconButton',
    'Typography',
  ];

  // Convert stats to arrays and calculate progress
  const componentStats = Array.from(migrationTracker.stats.values()).sort(
    (a, b) => b.lastUsed.getTime() - a.lastUsed.getTime()
  );

  const progress: MigrationProgress = {
    totalComponents: componentStats.length,
    migratedComponents: componentStats.filter(
      stat => stat.migrationPercentage > 80
    ).length,
    overallPercentage:
      componentStats.length > 0
        ? componentStats.reduce(
            (sum, stat) => sum + stat.migrationPercentage,
            0
          ) / componentStats.length
        : 0,
    highPriorityRemaining: componentStats.filter(
      stat =>
        highPriorityComponents.includes(stat.componentName) &&
        stat.migrationPercentage < 80
    ).length,
    recentActivity: componentStats.slice(0, 5),
  };

  const refreshStats = useCallback(() => {
    setLastUpdate(Date.now());
  }, []);

  const clearWarnings = useCallback(() => {
    migrationTracker.warnings = [];
    setLastUpdate(Date.now());
  }, []);

  // Auto-refresh stats every 10 seconds in development
  useEffect(() => {
    if (!migrationTracker.isEnabled) return;

    const interval = setInterval(refreshStats, 10000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  // Trigger re-render when lastUpdate changes
  useEffect(() => {
    // This effect ensures component re-renders when stats change
  }, [lastUpdate]);

  return {
    progress,
    componentStats,
    warnings: migrationTracker.warnings,
    highPriorityComponents,
    refreshStats,
    clearWarnings,
    isEnabled: migrationTracker.isEnabled,
  };
}

/**
 * React hook to warn about legacy Material-UI usage in development
 */
export function useMigrationWarning(
  componentName: string,
  filePath?: string
): void {
  useEffect(() => {
    if (!migrationTracker.isEnabled) return;

    // Check if this is a high-priority component
    const isHighPriority = [
      'Button',
      'TextField',
      'Select',
      'FormControl',
      'Checkbox',
      'Radio',
    ].includes(componentName);

    if (isHighPriority) {
      addMigrationWarning({
        severity: 'warning',
        message: `Consider migrating ${componentName} to use @/components/migration`,
        component: componentName,
        filePath,
        suggestion:
          'Replace import from @mui/material with @/components/migration',
        actionRequired: false,
      });
    }

    // Track usage
    trackComponentUsage(componentName, 'legacy', filePath);
  }, [componentName, filePath]);
}

/**
 * Track successful migration layer usage
 */
export function useMigrationSuccess(
  componentName: string,
  filePath?: string
): void {
  useEffect(() => {
    if (!migrationTracker.isEnabled) return;

    trackComponentUsage(componentName, 'migration', filePath);
  }, [componentName, filePath]);
}
