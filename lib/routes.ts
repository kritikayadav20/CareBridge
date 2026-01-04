/**
 * Route protection configuration
 * Defines which routes require which roles
 */

export const routePermissions: Record<string, string[]> = {
  // Patient-only routes
  '/dashboard/health-records': ['patient'],
  '/dashboard/health-records/add': ['patient'],
  '/dashboard/reports': ['patient'],
  
  // Hospital-only routes
  '/dashboard/transfers/new': ['hospital'],
  '/dashboard/admin': ['admin'],
  
  // Shared routes (multiple roles)
  '/dashboard': ['patient', 'doctor', 'hospital', 'admin'],
  '/dashboard/transfers': ['patient', 'hospital', 'doctor'],
  '/dashboard/profile': ['patient', 'doctor', 'hospital', 'admin'],
}

/**
 * Check if a route requires specific role
 */
export function requiresRole(pathname: string): string[] | null {
  // Check exact match first
  if (routePermissions[pathname]) {
    return routePermissions[pathname]
  }
  
  // Check prefix matches (for dynamic routes)
  for (const [route, roles] of Object.entries(routePermissions)) {
    if (pathname.startsWith(route)) {
      return roles
    }
  }
  
  return null
}

/**
 * Check if user role has access to route
 */
export function hasRouteAccess(userRole: string, pathname: string): boolean {
  const requiredRoles = requiresRole(pathname)
  
  // If route has no restrictions, allow access
  if (!requiredRoles) {
    return true
  }
  
  return requiredRoles.includes(userRole)
}

