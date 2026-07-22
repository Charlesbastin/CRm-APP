# TechnoCraft Supabase Setup

This folder contains the Supabase backend setup for the TechnoCraft college event app.

## 1. Create Supabase Project

1. Open Supabase.
2. Create a new project.
3. Save these values:
   - Project URL
   - anon public key

Do not use the service role key inside the mobile app.

## 2. Create Database Tables

Open Supabase SQL Editor and run:

```sql
-- Copy and run:
-- supabase/migrations/001_technocraft_schema.sql
```

This creates:

- departments
- categories
- profiles
- events
- registrations
- attendance
- notifications
- certificates
- feedback

It also enables Row Level Security and role-based policies.

## 3. Enable Authentication

In Supabase:

1. Go to Authentication.
2. Enable Email provider.
3. For testing, you can disable email confirmation.
4. For production, enable email confirmation.

## 4. Roles

Supported roles:

- student
- coordinator
- admin

Every signed-in user needs one row in `profiles`.

## 5. App Environment Values

Later, the Flutter app needs:

```dart
const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

## 6. Recommended Next Step

Build the real Flutter app against Supabase:

- Supabase Auth for login/register/logout
- `profiles` table for role-based navigation
- `events` table for discovery and details
- `registrations` table for QR passes
- `attendance` table for scanner check-in
- admin/coordinator screens using RLS policies

## Important

The current Android APK in this workspace is Firebase/WebView based.
This Supabase setup is ready for a proper Flutter app, but the APK is not connected to Supabase yet.
