-- Migration script to add users table and update books table
-- Run this script in your PostgreSQL database

-- Drop existing users table if it exists (WARNING: This will delete all user data)
DROP TABLE IF EXISTS users CASCADE;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- Add name column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
    ) THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(100) NOT NULL DEFAULT '';
    END IF;
END $$;

-- Add user_id column to books table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE books ADD COLUMN user_id BIGINT;
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_books_user'
    ) THEN
        ALTER TABLE books 
        ADD CONSTRAINT fk_books_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Make user_id NOT NULL after adding foreign key
-- Note: This will fail if there are existing books without user_id
-- If you have existing books, you'll need to either:
-- 1. Delete them first, or
-- 2. Assign them to a default user, or
-- 3. Make user_id nullable temporarily
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' 
        AND column_name = 'user_id' 
        AND is_nullable = 'YES'
    ) THEN
        -- Check if there are any books without user_id
        IF NOT EXISTS (SELECT 1 FROM books WHERE user_id IS NULL) THEN
            ALTER TABLE books ALTER COLUMN user_id SET NOT NULL;
        END IF;
    END IF;
END $$;

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);

-- Create index on email for faster login queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

