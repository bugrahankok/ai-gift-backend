-- Quick fix: Add missing 'name' column to users table
-- Run this in your PostgreSQL database

-- Connect to your database first:
-- psql -U postgres -d giftai

-- Add name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
    ) THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(100);
        -- Update existing rows with a default name (you can change this)
        UPDATE users SET name = email WHERE name IS NULL;
        -- Make it NOT NULL after setting default values
        ALTER TABLE users ALTER COLUMN name SET NOT NULL;
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

