# Manual Database Fix Instructions

## The Problem
The `users` table is missing the `name` column, causing Hibernate errors.

## Solution: Run These SQL Commands

### Step 1: Connect to PostgreSQL

**Option A: Using psql command line**
```bash
psql -U postgres -d giftai
```

**Option B: If you need to specify password**
```bash
PGPASSWORD=root psql -U postgres -d giftai
```

**Option C: Using full connection string**
```bash
psql postgresql://postgres:root@localhost:5432/giftai
```

### Step 2: Run These SQL Commands

Copy and paste these commands into your psql session:

```sql
-- Add name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
    ) THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(100);
        -- Set default value for existing rows (uses email username part)
        UPDATE users SET name = COALESCE(SPLIT_PART(email, '@', 1), 'User') WHERE name IS NULL;
        -- Make it NOT NULL after setting values
        ALTER TABLE users ALTER COLUMN name SET NOT NULL;
        RAISE NOTICE 'Added name column to users table';
    ELSE
        RAISE NOTICE 'Name column already exists';
    END IF;
END $$;

-- Verify the fix
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

### Step 3: Exit psql
```sql
\q
```

### Step 4: Restart Your Application

Restart your Spring Boot application and the error should be resolved.

## Alternative: One-Line Fix

If you prefer a single command:

```bash
psql -U postgres -d giftai -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100); UPDATE users SET name = COALESCE(SPLIT_PART(email, '@', 1), 'User') WHERE name IS NULL; ALTER TABLE users ALTER COLUMN name SET NOT NULL;"
```

## Using the Fix Script

You can also use the provided script:

```bash
./fix_database.sh
```

Or if you need to set the password:

```bash
DATABASE_PASSWORD=root ./fix_database.sh
```

## Verification

After running the fix, verify it worked:

```sql
\d users
```

You should see the `name` column in the table structure.

