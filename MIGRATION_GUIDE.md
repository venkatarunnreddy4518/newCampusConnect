# SQLite to MySQL Data Migration Guide

## Overview
This guide helps you migrate all existing data from SQLite database to MySQL.

## Prerequisites
- ✅ MySQL server running on localhost:3306
- ✅ Credentials configured in `.env` file
- ✅ MySQL database created: `campusconnect`
- ✅ Tables created in MySQL (via init.sql)
- ✅ `.env` file properly configured with:
  - DB_HOST
  - DB_PORT
  - DB_USER
  - DB_PASSWORD
  - DB_NAME

## Step 1: Ensure MySQL Database is Created

```bash
mysql -h localhost -u root -p
CREATE DATABASE IF NOT EXISTS campusconnect;
EXIT;
```

## Step 2: Initialize MySQL Tables

The MySQL tables should already be created. If not, start the server once:

```bash
npm run dev:server
# Wait for "Database initialized successfully" message
# Then press Ctrl+C to stop
```

## Step 3: Run the Migration Script

```bash
npm run migrate:sqlite-to-mysql
```

This script will:
- ✓ Read all data from `.local/campusconnect.sqlite`
- ✓ Connect to MySQL using credentials from `.env`
- ✓ Migrate all tables and records
- ✓ Show migration progress and statistics
- ✓ Display final verification counts

## Example Output

```
🚀 Starting SQLite to MySQL migration...

📖 Reading SQLite database: /path/to/.local/campusconnect.sqlite
🔗 Connecting to MySQL...

📊 Found 15 tables in SQLite:

📥 Migrating table: users
   ├─ Row count: 5
   ├─ Columns: id, email, password_hash, created_at
   └─ ✓ Migrated 5 records

📥 Migrating table: events
   ├─ Row count: 12
   ├─ Columns: id, name, date, venue, description, category, ...
   └─ ✓ Migrated 12 records

...

✅ Migration complete!
📊 Total records migrated: 127

Table row counts in MySQL:
  users: 5 rows
  events: 12 rows
  ...
```

## Verification

After migration, verify the data:

### Option 1: Using MySQL command line
```bash
mysql -h localhost -u root -p campusconnect
USE campusconnect;
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM events;
SELECT * FROM users LIMIT 1;
EXIT;
```

### Option 2: Using the application
```bash
npm run dev
# Access http://localhost:5173
# Check if data displays correctly
```

## Troubleshooting

### Error: "Cannot find sqlite module"
```bash
npm install
```

### Error: "Cannot find mysql2"
```bash
npm install
```

### Error: "Connection refused to MySQL"
- Check MySQL is running
- Verify DB_HOST, DB_PORT in `.env`
- Check MySQL credentials are correct

### Error: "Unknown database 'campusconnect'"
```bash
mysql -u root -p -e "CREATE DATABASE campusconnect;"
```

### Error: "Table doesn't exist"
- Initialize MySQL tables first:
```bash
npm run dev:server
# Wait for initialization, then Ctrl+C
```

### No data migrated?
1. Check if SQLite database exists: `.local/campusconnect.sqlite`
2. Check if MySQL can be accessed with current credentials
3. Check `.env` file has correct database name

## What Gets Migrated?

All tables from SQLite:
- users
- sessions
- password_reset_tokens
- profiles
- user_roles
- permissions
- events
- clubs
- club_memberships
- registrations
- notifications
- event_reminders
- whatsapp_messages
- whatsapp_settings
- site_settings
- live_matches
- match_scorecard

## After Migration

1. **Backup original SQLite file** (for safety):
   ```bash
   cp .local/campusconnect.sqlite .local/campusconnect.sqlite.backup
   ```

2. **Start using MySQL**:
   ```bash
   npm run dev
   ```

3. **Verify everything works**:
   - Test user login
   - Check events display
   - Verify data integrity

## Important Notes

- ⚠️ The migration uses `INSERT IGNORE` to skip duplicate entries
- ⚠️ If a record already exists in MySQL, it will be skipped
- ⚠️ Foreign key constraints are enforced in MySQL (unlike SQLite)
- ✓ You can run the script multiple times safely

## Rollback / Reset

If something goes wrong, you can reset:

```bash
# Drop MySQL database
mysql -h localhost -u root -p -e "DROP DATABASE campusconnect;"

# Recreate and reinitialize
mysql -h localhost -u root -p -e "CREATE DATABASE campusconnect;"
npm run dev:server  # Initialize tables
npm run migrate:sqlite-to-mysql  # Remigrate data
```

## Support

If you encounter issues:
1. Check MySQL is running
2. Verify `.env` credentials
3. Check `.local/campusconnect.sqlite` exists
4. Ensure MySQL database and tables exist
5. Review error messages in console

---

**Migration Steps Summary:**
1. ✅ Configure `.env` with MySQL credentials
2. ✅ Create MySQL database
3. ✅ Initialize MySQL tables
4. ✅ Run: `npm run migrate:sqlite-to-mysql`
5. ✅ Verify data in MySQL
