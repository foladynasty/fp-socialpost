-- Fix for RLS circular dependency issue
-- This script updates the RLS policies to avoid infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all posts" ON posts;
DROP POLICY IF EXISTS "Admins can update any post" ON posts;
DROP POLICY IF EXISTS "Admins can delete any post" ON posts;

-- Create a security definer function to check admin role
-- This bypasses RLS and prevents infinite recursion
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
