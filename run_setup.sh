#!/bin/bash

# PostgreSQL setup script runner
# This script runs the database setup SQL file

PSQL_PATH="/opt/homebrew/Cellar/libpq/18.1/bin/psql"
DB_NAME="aigiftdb"
DB_USER="postgres"
SQL_FILE="setup_tables_aigiftdb.sql"

# Check if psql exists
if [ ! -f "$PSQL_PATH" ]; then
    echo "❌ PostgreSQL client not found at $PSQL_PATH"
    echo "Trying to find psql..."
    PSQL_PATH=$(find /opt/homebrew -name psql 2>/dev/null | head -1)
    if [ -z "$PSQL_PATH" ]; then
        echo "❌ PostgreSQL client not found. Please install PostgreSQL or update PSQL_PATH in this script."
        exit 1
    fi
    echo "✅ Found psql at: $PSQL_PATH"
fi

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL file not found: $SQL_FILE"
    exit 1
fi

echo "🚀 Running database setup..."
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "SQL File: $SQL_FILE"
echo ""

# Run the SQL script
"$PSQL_PATH" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup completed successfully!"
else
    echo ""
    echo "❌ Database setup failed. Please check the error messages above."
    exit 1
fi

