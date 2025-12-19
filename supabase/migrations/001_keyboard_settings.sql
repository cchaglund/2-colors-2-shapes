-- Create keyboard_settings table for storing custom keyboard mappings
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS keyboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mappings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE keyboard_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own keyboard settings
CREATE POLICY "Users can read own keyboard settings"
  ON keyboard_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own keyboard settings
CREATE POLICY "Users can insert own keyboard settings"
  ON keyboard_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own keyboard settings
CREATE POLICY "Users can update own keyboard settings"
  ON keyboard_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own keyboard settings
CREATE POLICY "Users can delete own keyboard settings"
  ON keyboard_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS keyboard_settings_user_id_idx ON keyboard_settings(user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_keyboard_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function on updates
DROP TRIGGER IF EXISTS keyboard_settings_updated_at_trigger ON keyboard_settings;
CREATE TRIGGER keyboard_settings_updated_at_trigger
  BEFORE UPDATE ON keyboard_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_keyboard_settings_updated_at();
