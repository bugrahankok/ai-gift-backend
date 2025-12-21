# Database Migration Instructions

## Problem
The `users` table is missing the `name` column, causing the error:
```
ERROR: column "name" of relation "users" does not exist
```

## Solution

You have two options:

### Option 1: Run the Migration Script (Recommended)

1. Connect to your PostgreSQL database:
   ```bash
   psql -U postgres -d giftai
   ```

2. Run the migration script:
   ```bash
   psql -U postgres -d giftai -f migration.sql
   ```

   Or copy and paste the contents of `migration.sql` into your psql session.

### Option 2: Let Hibernate Recreate Tables (Development Only)

**⚠️ WARNING: This will delete all existing data!**

1. Stop your Spring Boot application

2. Update `application.properties`:
   ```properties
   spring.jpa.hibernate.ddl-auto=create-drop
   ```

3. Start the application - Hibernate will recreate all tables

4. After first startup, change it back to:
   ```properties
   spring.jpa.hibernate.ddl-auto=update
   ```

### Option 3: Manual SQL Commands

If you prefer to run commands manually:

```sql
-- Connect to database
\c giftai

-- Drop and recreate users table
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- Add user_id to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- Add foreign key
ALTER TABLE books 
ADD CONSTRAINT fk_books_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

## After Migration

1. Restart your Spring Boot application
2. The error should be resolved
3. You can now register and login users

## Notes

- If you have existing books in the database, you'll need to either:
  - Delete them (if they're test data)
  - Assign them to a user (if you want to keep them)
  - The migration script handles this by making `user_id` nullable first, then you can manually assign books to users

