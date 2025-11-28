#!/bin/bash

# Database fix script for BookifyAI
# This script will fix the users table by adding the missing 'name' column

echo "🔧 Fixing users table in PostgreSQL database..."

# Database connection details (update these if needed)
DB_NAME="giftai"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found"
    echo "Please install PostgreSQL client tools or use the SQL commands manually"
    exit 1
fi

# SQL commands to fix the table
SQL_COMMANDS="
-- Add name column if it doesn't exist
DO \$\$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
    ) THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(100);
        -- Set default value for existing rows
        UPDATE users SET name = COALESCE(SPLIT_PART(email, '@', 1), 'User') WHERE name IS NULL;
        -- Make it NOT NULL after setting values
        ALTER TABLE users ALTER COLUMN name SET NOT NULL;
        RAISE NOTICE 'Added name column to users table';
    ELSE
        RAISE NOTICE 'Name column already exists';
    END IF;
END \$\$;

-- Verify the fix
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
"

echo "📝 Running SQL commands..."
echo ""

# Try to run the SQL commands
if PGPASSWORD="${DATABASE_PASSWORD:-root}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$SQL_COMMANDS"; then
    echo ""
    echo "✅ Database fix completed successfully!"
    echo "🔄 Please restart your Spring Boot application"
else
    echo ""
    echo "❌ Error: Failed to connect to database"
    echo ""
    echo "Please run this SQL manually:"
    echo "----------------------------------------"
    echo "$SQL_COMMANDS"
    echo "----------------------------------------"
    echo ""
    echo "Or connect to PostgreSQL and run:"
    echo "  psql -U postgres -d giftai"
    echo "Then paste the SQL commands above"
fi

