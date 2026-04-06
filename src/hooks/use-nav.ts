'use client';

/**
 * Navigation filtering hook - simplified for custom auth
 *
 * Previously used Clerk's useOrganization and useUser hooks for RBAC filtering.
 * Now uses the custom auth store (authStore) for permission checks.
 *
 * Note: For now, returns all navigation items since the auth store and
 * backend permission system are not yet implemented. This hook will be
 * enhanced once Phase 3 creates the auth store with role-based permissions.
 */

import { useMemo } from 'react';
import type { NavItem, NavGroup } from '@/types';

/**
 * Hook to filter navigation items based on RBAC
 *
 * @param items - Array of navigation items to filter
 * @returns Filtered items (currently all items - RBAC pending Phase 3)
 */
export function useFilteredNavItems(items: NavItem[]) {
  // TODO: Once auth store is implemented in Phase 3, integrate role-based filtering
  // import { authStore } from '@/stores/auth-store';
  // const { user } = authStore.getState();
  // const userRole = user?.role;

  // For now, return all items since we don't have org/permission system yet
  // Later: check authStore.user.role for permission filtering
  return useMemo(() => items, [items]);
}

/**
 * Hook to filter navigation groups based on RBAC
 *
 * @param groups - Array of navigation groups to filter
 * @returns Filtered groups (currently all groups - RBAC pending Phase 3)
 */
export function useFilteredNavGroups(groups: NavGroup[]) {
  // TODO: Once auth store is implemented in Phase 3, filter based on user permissions
  // For now, return all groups with all items

  return useMemo(() => groups, [groups]);
}
