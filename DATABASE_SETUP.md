# PostgreSQL Database Setup

## Prerequisites

1. Install PostgreSQL on your system
   - macOS: `brew install postgresql@15`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`
   - Windows: Download from https://www.postgresql.org/download/

2. Start PostgreSQL service
   - macOS: `brew services start postgresql@15`
   - Linux: `sudo systemctl start postgresql`
   - Windows: Start PostgreSQL service from Services

## Database Setup Steps

1. **Connect to PostgreSQL:**
   ```bash
   psql -U postgres
   ```

2. **Create Database:**
   ```sql
   CREATE DATABASE giftai;
   ```

3. **Create User (optional, if not using default postgres user):**
   ```sql
   CREATE USER giftai_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE giftai TO giftai_user;
   ```

4. **Verify Database:**
   ```sql
   \l
   ```
   You should see `giftai` in the list.

5. **Exit psql:**
   ```sql
   \q
   ```

## Configuration

Update your `.env` file with your PostgreSQL credentials:

```env
DATABASE_URL=jdbc:postgresql://localhost:5432/giftai
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
```

## Default Configuration

The application uses these default values (can be overridden via .env):
- **Host:** localhost
- **Port:** 5432
- **Database:** giftai
- **Username:** postgres
- **Password:** postgres

## Verify Connection

After starting the application, check the logs for:
```
HikariPool-1 - Starting...
HikariPool-1 - Start completed.
```

If you see connection errors, verify:
1. PostgreSQL is running
2. Database `giftai` exists
3. Credentials in `.env` are correct
4. PostgreSQL is listening on port 5432

## Troubleshooting

### Connection Refused
- Check if PostgreSQL is running: `pg_isready`
- Verify port 5432 is not blocked by firewall

### Authentication Failed
- Check username and password in `.env`
- Verify user has access to the database

### Database Does Not Exist
- Create the database: `CREATE DATABASE giftai;`

