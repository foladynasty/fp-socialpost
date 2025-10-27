# RLS Fix for Admin Dashboard Issue

## Problem
Admins were experiencing infinite buffering and calendar flashing when trying to view the dashboard.

## Root Cause
**Circular RLS Policy Dependency**

The admin policies were checking the `profiles` table to verify admin role:
```sql
using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
)
```

But the `profiles` table itself had RLS enabled, creating a circular dependency:
- To read posts → check if user is admin
- To check if user is admin → read profiles table
- To read profiles → check if user is admin (infinite loop!)

## Solution

### Step 1: Run the RLS Fix Script

1. **Go to your Supabase Dashboard**
   - Navigate to: **SQL Editor**

2. **Copy and paste the contents of `supabase-rls-fix.sql`**
   ```sql
   -- Drop existing problematic policies
   DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
   DROP POLICY IF EXISTS "Admins can view all posts" ON posts;
   DROP POLICY IF EXISTS "Admins can update any post" ON posts;
   DROP POLICY IF EXISTS "Admins can delete any post" ON posts;

   -- Create a security definer function to check admin role
   CREATE OR REPLACE FUNCTION is_admin()
   RETURNS BOOLEAN AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM profiles
       WHERE id = auth.uid() AND role = 'admin'
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Recreate admin policies using the function
   CREATE POLICY "Admins can view all profiles"
     ON profiles FOR SELECT
     USING (is_admin());

   CREATE POLICY "Admins can view all posts"
     ON posts FOR SELECT
     USING (is_admin());

   CREATE POLICY "Admins can update any post"
     ON posts FOR UPDATE
     USING (is_admin());

   CREATE POLICY "Admins can delete any post"
     ON posts FOR DELETE
     USING (is_admin());
   ```

3. **Run the script** (click "Run" or press Ctrl+Enter)

### Step 2: Verify the Fix

1. **Refresh your application**
2. **Sign in as admin**
3. **Navigate to Dashboard**

You should now see:
- ✅ Calendar loads without buffering
- ✅ All posts are visible
- ✅ No more flashing

## What Changed in the Code

### 1. Enhanced Error Handling
- Added `console.error` to log errors
- Set `retry: 1` to prevent infinite retries
- Added `staleTime: 30s` to reduce queries

### 2. Better User Feedback
- Error alert shows when posts fail to load
- Helpful message guides users to fix RLS
- Clear loading states

## Why This Works

The `SECURITY DEFINER` function runs with the permissions of the function creator (superuser), bypassing RLS. This breaks the circular dependency:

- To read posts → call `is_admin()`
- `is_admin()` runs with elevated permissions
- Function directly checks profiles table (no RLS check)
- Returns true/false
- Policy allows/denies access

## Testing

After running the fix, test these scenarios:

**As Admin:**
- ✅ View all posts in calendar
- ✅ Create new posts
- ✅ Edit any post
- ✅ Delete any post

**As Creator:**
- ✅ View only own posts
- ✅ Create new posts
- ✅ Edit only draft/rejected posts
- ✅ Cannot edit pending/approved posts

## Need Help?

If you still see issues:
1. Check browser console for errors
2. Verify the SQL script ran successfully
3. Confirm user role is set to 'admin' in Supabase
4. Try signing out and back in

---

**Fixed in commit:** `43d2966`
