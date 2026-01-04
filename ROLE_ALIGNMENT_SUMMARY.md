# Role Alignment Summary

This document summarizes the changes made to align CareBridge with the final roles and responsibilities.

## Changes Implemented

### 1. Patient Registration
- ✅ **Removed hospital signup option** from public signup page
- ✅ Only patients can self-register via `/signup`
- ✅ Updated signup API to reject hospital role registrations
- ✅ Patients start with "Not admitted to any hospital" status

### 2. Patient Admission System
- ✅ **Database Schema**: Added `current_hospital_id` field to `patients` table
- ✅ **Admission Feature**: Created `/dashboard/hospital/patients` page for hospitals to:
  - Search patients by email or patient ID
  - Admit patients to their hospital
- ✅ **Database Function**: Created `admit_patient()` function for secure admission
- ✅ **Patient Dashboard**: Shows admission status (Admitted/Not Admitted)

### 3. Hospital Dashboard Updates
- ✅ Added "Manage Patients" button linking to patient management
- ✅ Shows summary of currently admitted patients
- ✅ Added navigation links for Patients and Doctors management

### 4. Doctor Creation
- ✅ **Moved from Admin to Hospitals**: Doctors are now created by hospitals, not admin
- ✅ Created `/dashboard/hospital/doctors` page for hospitals to manage doctors
- ✅ Created `/api/hospital/create-doctor` endpoint (hospital-only access)
- ✅ Doctors are automatically linked to their creating hospital via `hospital_id` field

### 5. Admin Panel Updates
- ✅ **Restricted to Hospital Creation Only**: Admin can only create hospital accounts
- ✅ Removed doctor creation option from admin panel
- ✅ Updated UI messaging to clarify admin role

### 6. Transfer Request Restrictions
- ✅ **Only Admitted Patients**: Transfer requests can only be made for patients admitted to the requesting hospital
- ✅ Updated transfer request form to show only admitted patients
- ✅ Added helpful message if no patients are admitted

### 7. Transfer Acceptance
- ✅ **Auto-Admission**: When a transfer is accepted, the patient is automatically admitted to the receiving hospital
- ✅ Updated `AcceptTransferButton` to update `current_hospital_id` on acceptance

## Database Changes Required

**IMPORTANT**: You must run the SQL script to add the necessary database fields and functions:

```bash
# Run this in Supabase SQL Editor:
database/add-patient-admission.sql
```

This script adds:
- `current_hospital_id` column to `patients` table
- `hospital_id` column to `users` table (for doctor-hospital relationship)
- RLS policies for patient admission
- `admit_patient()` database function

## New Pages Created

1. **`/dashboard/hospital/patients`** - Hospital patient management
   - Search and admit patients
   - View all admitted patients

2. **`/dashboard/hospital/doctors`** - Hospital doctor management
   - Create doctor accounts
   - View all doctors at the hospital

## Updated Pages

1. **`/signup`** - Removed hospital signup option
2. **`/dashboard`** - Added admission status for patients, admitted patients list for hospitals
3. **`/dashboard/transfers/new`** - Only shows admitted patients
4. **`/dashboard/admin`** - Only allows hospital creation

## Role Responsibilities (Final)

### Patient
- ✅ Self-register via signup
- ✅ View own health data
- ✅ See admission status
- ✅ View transfer history
- ❌ Cannot admit themselves
- ❌ Cannot request transfers
- ❌ Cannot choose hospitals

### Hospital
- ✅ Search patients by email/ID
- ✅ Admit patients
- ✅ View admitted patients
- ✅ Create doctor accounts
- ✅ Request transfers (for admitted patients only)
- ✅ Accept incoming transfers
- ❌ Cannot see all patients globally
- ❌ Cannot see other hospitals' patients (unless transferred)

### Doctor
- ✅ View patients admitted to their hospital
- ✅ Update medical records
- ✅ View charts and AI summaries
- ❌ Cannot admit patients
- ❌ Cannot request/accept transfers
- ❌ Cannot see other hospitals' patients

### Admin
- ✅ Create hospital accounts only
- ❌ Does not manage patients or doctors day-to-day

## Next Steps

1. **Run the SQL script** (`database/add-patient-admission.sql`) in Supabase SQL Editor
2. **Test the flow**:
   - Patient registers → Shows "Not Admitted"
   - Hospital searches and admits patient → Patient shows "Admitted"
   - Hospital can request transfer for admitted patient
   - Receiving hospital accepts → Patient automatically admitted to new hospital
3. **Verify doctor creation**:
   - Hospital creates doctor account
   - Doctor can view patients at their hospital

## Notes

- All existing features remain intact
- Only logic, permissions, and UI wording were adjusted
- No breaking changes to existing functionality
- Patient admission is the only way to link patients to hospitals

