# Quick Fix for "column name does not exist" Error

## The Problem
The `users` table exists but is missing the `name` column.

## Solution: Run This SQL Command

**Option 1: Using psql command line**
```bash
psql -U postgres -d giftai -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100); UPDATE users SET name = email WHERE name IS NULL; ALTER TABLE users ALTER COLUMN name SET NOT NULL;"
```

**Option 2: Using psql interactive**
```bash
psql -U postgres -d giftai
```
Then run:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100);
UPDATE users SET name = email WHERE name IS NULL;
ALTER TABLE users ALTER COLUMN name SET NOT NULL;
```

**Option 3: Run the fix script**
```bash
psql -U postgres -d giftai -f fix_users_table.sql
```

## Alternative: Let Hibernate Recreate the Table

If you don't have important data in the `users` table:

1. Stop the application
2. In `application.properties`, temporarily change:
   ```properties
   spring.jpa.hibernate.ddl-auto=create-drop
   ```
3. Start the application (it will recreate all tables)
4. Stop the application
5. Change back to:
   ```properties
   spring.jpa.hibernate.ddl-auto=update
   ```
6. Start the application again

## After Fixing

1. Restart your Spring Boot application
2. The error should be resolved
3. Try registering a new user

