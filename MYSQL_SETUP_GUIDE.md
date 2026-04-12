# MySQL Migration Guide for CampusConnect

## Overview
This guide helps you migrate CampusConnect from SQLite to MySQL running on your laptop.

## Prerequisites
- MySQL Server installed and running on your laptop
- MySQL credentials (username, password)
- Node.js dependencies updated

## Step 1: Install MySQL Server (if not already installed)

### On Windows:
1. Download MySQL Community Server: https://dev.mysql.com/downloads/windows/installer/
2. Run the installer and follow the setup wizard
3. Note your root password or create a custom user
4. MySQL will typically run on `localhost:3306`

### Verify MySQL is running:
```bash
mysql -h localhost -u root -p
```

## Step 2: Create the Database

Connect to MySQL and create the database:

```bash
# Connect to MySQL
mysql -h localhost -u root -p

# In MySQL prompt, create the database:
CREATE DATABASE campusconnect;
EXIT;
```

## Step 3: Configure Environment Variables

1. Create a `.env` file in the project root (copy from `.env.example`):
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campusconnect
FLASK_SECRET_KEY=your_secret_key_here
```

2. Update the values with your MySQL credentials

## Step 4: Install Node.js Dependencies

```bash
cd path/to/newCampusConnect
npm install
```

This will install `mysql2` and `dotenv` packages.

## Step 5: Install Flask Dependencies

```bash
cd backend_flask
pip install -r requirements.txt
```

## Step 6: Initialize the Database

The database tables will be created automatically when you start the server:

```bash
npm run dev:server
```

The `initializeDatabase()` function will:
- Connect to your MySQL database
- Create all necessary tables
- Set up foreign key constraints

## Step 7: Verify the Setup

### Check MySQL:
```bash
mysql -h localhost -u root -p
USE campusconnect;
SHOW TABLES;
EXIT;
```

### Check Server:
```bash
npm run dev:server
# Should show: "Database initialized successfully"
```

## Important Notes

### Breaking Changes from SQLite:
- Database calls are now **asynchronous**
- The server code has been updated to handle async/await
- Make sure your Node.js version supports async/await (Node 12+)

### Configuration File Locations:
- Node.js config: `.env`
- Database schema: `database/init.sql`
- Database module: `server/database.mjs`

### Troubleshooting

**Connection Error: "Error: connect ECONNREFUSED"**
- Make sure MySQL server is running
- Check DB_HOST, DB_PORT in .env
- Verify MySQL credentials

**Error: "Unknown database 'campusconnect'"**
- Run: `mysql -h localhost -u root -p -e "CREATE DATABASE campusconnect;"`

**Table exists errors on startup**
- This is normal if tables already exist
- The initialization script ignores duplicate table errors

**Permission issues**
- Make sure your MySQL user has privileges:
  ```bash
  mysql -h localhost -u root -p
  GRANT ALL PRIVILEGES ON campusconnect.* TO 'root'@'localhost';
  FLUSH PRIVILEGES;
  ```

## Running the Application

### Start Backend Server (MySQL):
```bash
npm run dev:server
```
Server runs on: `http://localhost:3001`

### Start Flask Backend:
```bash
cd backend_flask
python run.py
```
Flask runs on: `http://127.0.0.1:5000`

### Start Frontend:
```bash
npm run dev:web
```
Frontend runs on: `http://localhost:5173`

### Run All (recommended):
```bash
npm run dev
```
This starts both the Node.js server and Vite dev server

## Additional MySQL Configuration

### Create a dedicated database user (recommended for production):
```bash
mysql -h localhost -u root -p

CREATE USER 'campusconnect_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON campusconnect.* TO 'campusconnect_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Then update `.env`:
```
DB_USER=campusconnect_user
DB_PASSWORD=strong_password
```

### Backup and Restore

Backup your database:
```bash
mysqldump -h localhost -u root -p campusconnect > backup.sql
```

Restore from backup:
```bash
mysql -h localhost -u root -p campusconnect < backup.sql
```

## Migration from SQLite

If you had existing SQLite data, you'll need to:

1. Export data from SQLite (if needed)
2. The init.sql script will create fresh tables
3. Re-populate data through the application

## Support

If you encounter issues:
1. Check MySQL is running: `mysql -h localhost -u root -p`
2. Verify .env file has correct credentials
3. Check server logs for detailed errors
4. Review database/init.sql for schema

---

**Note**: The database has been successfully configured for MySQL with async/await support. The server will automatically initialize tables on first startup.
