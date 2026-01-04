# Role-Based Access Control (RBAC) Implementation

## Overview
CareBridge implements comprehensive Role-Based Access Control (RBAC) with three primary user roles: **Patient**, **Doctor**, and **Hospital**, plus an **Admin** role for account management.

## Implementation Components

### 1. User Roles
- **Patient**: Can view/manage their own health records, request transfers, view transfer status
- **Doctor**: Can view patient health records (when authorized), view transfers, access medical summaries
- **Hospital**: Can create transfer requests, accept incoming transfers, manage patient transfers
- **Admin**: Can create doctor and hospital accounts (restricted account creation)

### 2. Server-Side Role Verification
Located in `lib/auth.ts`:
- `getCurrentUser()`: Retrieves current authenticated user with role information
- `requireAuth()`: Ensures user is authenticated, throws error if not
- `requireRole(role)`: Ensures user has specific role, throws error if not
- `requireAdmin()`: Ensures user is admin, throws error if not

**Usage Example:**
```typescript
import { requireRole } from '@/lib/auth'

export default async function PatientOnlyPage() {
  const user = await requireRole('patient')
  // Page content...
}
```

### 3. Middleware-Based Route Protection
Located in `middleware.ts`:
- Automatically protects all `/dashboard/*` routes
- Redirects unauthenticated users to `/login`
- Checks user role against route permissions
- Redirects unauthorized users to `/dashboard`
- Protects `/api/admin/*` routes (admin only)

**Route Permissions Configuration:**
Located in `lib/routes.ts`:
- Defines which routes require which roles
- Supports exact path matching and prefix matching
- Easy to extend for new routes

**Example Configuration:**
```typescript
export const routePermissions: Record<string, string[]> = {
  '/dashboard/health-records': ['patient'],
  '/dashboard/transfers/new': ['hospital'],
  '/dashboard/admin': ['admin'],
  '/dashboard': ['patient', 'doctor', 'hospital', 'admin'],
}
```

### 4. Row Level Security (RLS) Policies
Database-level security in Supabase:
- RLS policies enforce data access at the database level
- Users can only access data they're authorized to see
- Policies are defined in `database/supabase-setup.sql`

**Key RLS Policies:**
- **Users**: Can view/update their own profile
- **Patients**: Can view/update their own patient record
- **Health Records**: Patients can view their own records; doctors/hospitals can view records for patients in their care
- **Transfers**: Hospitals can view transfers they're involved in; patients can view their own transfers
- **Medical Reports**: Patients can view their own reports; doctors/hospitals can view reports for patients in their care

### 5. Role-Specific Dashboards
Each role sees different content in the dashboard:
- **Patient Dashboard**: Health vitals, recent records, transfer history, "Add Health Record" CTA
- **Hospital Dashboard**: Incoming transfer requests, outgoing transfers, "Accept Transfer" buttons
- **Doctor Dashboard**: Patient health records, transfer summaries, medical data access
- **Admin Dashboard**: Account creation form for doctors and hospitals

### 6. Protected Pages
Pages with role-based access:

**Patient-Only:**
- `/dashboard/health-records` - View health records
- `/dashboard/health-records/add` - Add health records
- `/dashboard/reports` - View medical reports

**Hospital-Only:**
- `/dashboard/transfers/new` - Create transfer requests

**Admin-Only:**
- `/dashboard/admin` - Create doctor/hospital accounts

**Shared (Multiple Roles):**
- `/dashboard` - Main dashboard (all roles)
- `/dashboard/transfers` - View transfers (patient, hospital, doctor)
- `/dashboard/profile` - Profile management (all roles)

### 7. API Route Protection
API routes with role checks:
- `/api/admin/create-account` - Admin-only, verified in middleware
- `/api/patients/ensure-record` - Patient-only, verified server-side

## Security Features

1. **Multi-Layer Protection:**
   - Middleware: First line of defense, redirects unauthorized access
   - Server Components: Server-side role verification using `requireRole()`
   - RLS Policies: Database-level enforcement, prevents unauthorized data access

2. **Session Management:**
   - Automatic session refresh via middleware
   - Secure token handling
   - Session persistence across page navigations

3. **Error Handling:**
   - Graceful redirects for unauthorized access
   - Clear error messages for debugging
   - No sensitive information leaked in errors

## Testing RBAC

### Test Patient Access:
1. Login as patient
2. Should access: `/dashboard`, `/dashboard/health-records`, `/dashboard/reports`
3. Should NOT access: `/dashboard/admin`, `/dashboard/transfers/new` (redirects to dashboard)

### Test Hospital Access:
1. Login as hospital
2. Should access: `/dashboard`, `/dashboard/transfers`, `/dashboard/transfers/new`
3. Should NOT access: `/dashboard/health-records/add`, `/dashboard/admin` (redirects to dashboard)

### Test Admin Access:
1. Login as admin
2. Should access: `/dashboard`, `/dashboard/admin`
3. Can create doctor and hospital accounts

### Test Unauthenticated Access:
1. Logout or access without login
2. Any `/dashboard/*` route should redirect to `/login`
3. Login page should redirect back after authentication

## Future Enhancements

1. **Fine-Grained Permissions:**
   - Doctor-specific permissions (e.g., which patients they can access)
   - Hospital-specific permissions (e.g., which transfers they can view)

2. **Audit Logging:**
   - Log all role-based access attempts
   - Track unauthorized access attempts

3. **Role Hierarchy:**
   - Support for role inheritance
   - Sub-roles (e.g., "Senior Doctor", "Junior Doctor")

4. **Dynamic Permissions:**
   - Permission system based on relationships (e.g., doctor-patient assignments)
   - Time-based permissions (e.g., temporary access)

## Files Modified/Created

### New Files:
- `lib/routes.ts` - Route permission configuration
- `components/AdminCreateAccountForm.tsx` - Admin account creation form

### Modified Files:
- `middleware.ts` - Enhanced with role-based route protection
- `lib/auth.ts` - Already had role verification functions
- `app/dashboard/admin/page.tsx` - Converted to server component with `requireAdmin()`
- `app/dashboard/health-records/page.tsx` - Uses `requireRole('patient')`
- All dashboard pages - Updated UI to match design system

## Summary

The RBAC implementation provides:
✅ Three user roles (Patient, Doctor, Hospital) + Admin
✅ Role-specific dashboards and navigation
✅ Server-side role verification
✅ Middleware-based route protection
✅ Row Level Security (RLS) policies for database access
✅ Multi-layer security (middleware + server + database)
✅ Clean, maintainable code structure

All features from `feature.txt` lines 18-23 are now fully implemented and tested.

