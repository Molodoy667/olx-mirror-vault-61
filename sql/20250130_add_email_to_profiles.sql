-- Add email field to profiles table for better login handling
-- Migration: 20250130_add_email_to_profiles.sql
-- Purpose: Add email field to profiles for username login functionality

-- 1. Add email column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Create index for efficient email queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 3. Create index for efficient username queries
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 4. Update existing profiles with email from auth.users
UPDATE profiles 
SET email = auth.users.email
FROM auth.users 
WHERE profiles.id = auth.users.id 
  AND profiles.email IS NULL;

-- 5. Create trigger to automatically set email when profile is created
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Get email from auth.users for the user_id
  SELECT email INTO NEW.email 
  FROM auth.users 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger
DROP TRIGGER IF EXISTS trigger_sync_profile_email ON profiles;
CREATE TRIGGER trigger_sync_profile_email
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email();

-- 7. Verification
SELECT 'email column added successfully! ✅' as status;

-- 8. Check the results
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'email';

-- 9. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
  AND (indexname LIKE '%email%' OR indexname LIKE '%username%');

-- 10. Show sample data
SELECT 
  id, 
  full_name, 
  username,
  email,
  created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- ✅ ГОТОВО! Тепер можна входити як через email, так і через username!