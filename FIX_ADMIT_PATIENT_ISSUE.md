# Fix Admit Patient Issue

## Problem
After admitting a patient, the success message shows but:
1. `current_hospital_id` is not being set in the patients table
2. No patients are showing in the hospital dashboard
3. The hospital_id is not being allocated

## Root Causes
1. **Database Function**: The `admit_patient` function may need improvement for better error handling
2. **Query Issues**: Multiple foreign key relationships between `patients` and `users` tables causing query ambiguity
3. **Relationship Specification**: Queries need to explicitly specify which foreign key to use

## Solutions Applied

### 1. Fixed Query Relationships
- Updated `app/dashboard/hospital/patients/page.tsx` to use explicit relationship: `users!user_id(*)`
- Updated `app/dashboard/page.tsx` to use explicit relationship: `users!user_id(*)`
- This fixes the "more than one relationship" error

### 2. Improved Database Function
- Created `database/improve-admit-patient-function.sql` with better error handling
- Added row count verification
- Added double-check after update
- Better error messages

### 3. Added Debugging
- Added console logging in `AdmitPatientForm.tsx` to verify updates
- Added error logging in hospital patients page

## Steps to Fix

### Step 1: Run the Improved Function
1. Open Supabase SQL Editor
2. Run `database/improve-admit-patient-function.sql`
3. This will replace the existing function with a more robust version

### Step 2: Verify the Function Works
1. Try admitting a patient again
2. Check the browser console for any errors
3. Check the network tab to see if the RPC call succeeds

### Step 3: Verify Database Updates
1. Go to Supabase Table Editor
2. Check the `patients` table
3. Verify that `current_hospital_id` is being set correctly

### Step 4: Test the Display
1. After admitting a patient, refresh the hospital patients page
2. The patient should appear in the "Currently Admitted Patients" list
3. The patient should also appear on the main dashboard

## Troubleshooting

### If patients still don't show:
1. **Check the function exists**: Run this in SQL Editor:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name = 'admit_patient';
   ```

2. **Check the column exists**: Run this in SQL Editor:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = 'patients' 
   AND column_name = 'current_hospital_id';
   ```

3. **Test the function directly**: Replace with actual IDs:
   ```sql
   SELECT public.admit_patient('patient-uuid-here', 'hospital-uuid-here');
   ```

4. **Check browser console**: Look for any JavaScript errors or network errors

5. **Verify authentication**: Make sure you're logged in as a hospital user

## Expected Behavior After Fix

1. When you search and admit a patient:
   - Success message appears
   - `current_hospital_id` is set in the database
   - Patient appears in the hospital patients list
   - Patient appears on the hospital dashboard

2. The `current_hospital_id` column should contain the UUID of the hospital user

3. The hospital's own record doesn't need a `hospital_id` - it's identified by its `user.id`

## Notes

- The `hospital_id` column in the `users` table is for **doctors** to track which hospital they belong to, not for hospitals themselves
- Hospitals are identified by their `user.id` (the UUID in the `users` table)
- Patients are linked to hospitals via `current_hospital_id` in the `patients` table

