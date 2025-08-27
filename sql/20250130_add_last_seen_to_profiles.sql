-- Add last_seen field to profiles table for online status tracking
ALTER TABLE profiles 
ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for efficient queries
CREATE INDEX idx_profiles_last_seen ON profiles(last_seen);

-- Create function to update last_seen
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_seen on any profile update
CREATE TRIGGER trigger_update_last_seen
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

-- Function to manually update last_seen (for client calls)
CREATE OR REPLACE FUNCTION update_user_last_seen(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET last_seen = NOW() 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_last_seen(UUID) TO authenticated;

-- Set initial last_seen for existing users
UPDATE profiles SET last_seen = NOW() WHERE last_seen IS NULL;