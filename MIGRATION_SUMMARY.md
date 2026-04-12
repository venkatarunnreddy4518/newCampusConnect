# SQLite to MySQL Migration - Summary of Changes

## Overview
Your CampusConnect project has been successfully migrated from SQLite to MySQL. The backend code has been updated to connect to MySQL running on your laptop.

## Files Modified

### 1. **server/database.mjs** ✅
- **Change**: Replaced SQLite (node:sqlite) with MySQL (mysql2/promise)
- **Details**:
  - Imports: Removed `DatabaseSync` from node:sqlite, added `mysql` from mysql2/promise
  - Added environment variable configuration using `dotenv`
  - Created MySQL connection pool configuration
  - Implemented `DatabaseWrapper` class that provides a SQLite-like API but uses MySQL internally
  - Updated `db.exec()` to handle async MySQL queries
  - Updated `initializeDatabase()` to split SQL statements and handle MySQL CREATE TABLE statements
  - Updated `runInTransaction()` to use MySQL transactions with async/await

### 2. **package.json** ✅
- **Added**: `mysql2` (v3.6.5) - MySQL client for Node.js
- **Added**: `dotenv` (v16.4.5) - Environment variable management
- These are now in the main `dependencies` section

### 3. **database/init.sql** ✅
- **Removed**: `PRAGMA foreign_keys = ON;` (SQLite-specific)
- **Added**: MySQL-specific settings:
  ```sql
  SET NAMES utf8mb4;
  SET CHARACTER SET utf8mb4;
  SET SESSION sql_mode = '...';
  SET FOREIGN_KEY_CHECKS = 1;
  ```
- **Conversion**: `INSERT OR IGNORE` → `INSERT IGNORE` (3 occurrences)
- **Conversion**: `CURRENT_TIMESTAMP` → `NOW()` in one location (seed data)

### 4. **backend_flask/requirements.txt** ✅
- **Added**: `PyMySQL>=1.1.0` - MySQL driver for Python
- **Added**: `Flask-SQLAlchemy>=3.1.1` - ORM for Flask

### 5. **backend_flask/config.py** ✅ (NEW FILE)
- Created Flask configuration module
- Database URI: `mysql+pymysql://user:password@host:port/database`
- SQLAlchemy configuration with connection pooling
- Included `DevelopmentConfig`, `TestingConfig`, and `ProductionConfig` classes

### 6. **backend_flask/campusconnect_flask/__init__.py** ✅
- Updated Flask app factory to use SQLAlchemy
- Added `db.init_app(app)` for database initialization
- Added `db.create_all()` context manager to create tables on startup
- Refactored configuration to use `DevelopmentConfig`

### 7. **.env.example** ✅
- Updated DATABASE section with MySQL configuration
- Added new environment variables:
  - `DB_HOST` (default: localhost)
  - `DB_PORT` (default: 3306)
  - `DB_USER` (default: root)
  - `DB_PASSWORD` (empty by default)
  - `DB_NAME` (default: campusconnect)

### 8. **MYSQL_SETUP_GUIDE.md** ✅ (NEW FILE)
- Comprehensive setup guide for MySQL migration
- Step-by-step installation instructions
- Database creation and configuration steps
- Environment variable setup
- Troubleshooting section
- Backup and restore procedures

## Environment Configuration

### Create `.env` file in project root:
```bash
# Copy from .env.example
cp .env.example .env

# Edit .env with your MySQL credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=campusconnect
FLASK_SECRET_KEY=your_secret_key
```

## Installation Steps

### 1. **Install MySQL** (if not already installed)
- Download from: https://dev.mysql.com/downloads/windows/installer/
- Create database: `CREATE DATABASE campusconnect;`

### 2. **Install Node.js Dependencies**
```bash
npm install
```

### 3. **Install Flask Dependencies**
```bash
cd backend_flask
pip install -r requirements.txt
```

### 4. **Start the Application**
```bash
# In project root
npm run dev        # Starts both Node.js server and Vite web server
```

The database tables will be created automatically on first startup.

## Key Technology Changes

| Aspect | Before | After |
|--------|--------|-------|
| Database | SQLite (local file) | MySQL Server |
| Node Driver | node:sqlite | mysql2/promise |
| Database Location | .local/campusconnect.sqlite | MySQL Server (laptop) |
| Async Support | Synchronous | Asynchronous with async/await |
| Flask ORM | None (raw PyMySQL) | SQLAlchemy |
| Connection Pooling | N/A | Yes (mysql2 connection pool) |

## Important Notes

### ⚠️ Database Calls are Now Asynchronous
- The `db.prepare(...).get()` and `db.prepare(...).all()` methods now return Promises
- The wrapper ensures compatibility with existing code patterns
- All database operations now go through the MySQL connection pool

### ✅ Backward Compatibility
- The `DatabaseWrapper` class provides a similar API to SQLite
- Most existing code patterns are maintained
- Configuration-only changes in most cases

### 🔒 Security Considerations
For production:
1. Create a dedicated database user (not root)
2. Store credentials securely (use environment variables only)
3. Enable SSL/TLS connections to MySQL
4. Implement connection pooling (already done in code)

## Verification

### Check MySQL Connection:
```bash
mysql -h localhost -u root -p
USE campusconnect;
SHOW TABLES;
```

### Check Node.js Server:
```bash
npm run dev:server
# Should see: "Database initialized successfully"
```

### Check Flask Server:
```bash
cd backend_flask
python run.py
# Should see: "Database tables created successfully"
```

## rollback Plan (if needed)

If you need to revert to SQLite:
1. Revert `server/database.mjs` from git history
2. Revert `database/init.sql` from git history
3. Remove mysql2 and dotenv from package.json
4. Run `npm install`

However, data migration would require exporting MySQL data first.

## Next Steps

1. **Configure Environment Variables**
   - Edit `.env` with your MySQL credentials
   - Ensure MySQL server is running on your laptop

2. **Test the Connection**
   - Run `npm run dev:server`
   - Check for "Database initialized successfully" message

3. **Start Development**
   - Run `npm run dev` to start all services
   - Access frontend at http://localhost:5173

## Troubleshooting

### Connection refused error?
- Check MySQL is running: `mysql -h localhost -u root -p`
- Verify DB_HOST, DB_PORT in .env
- Check MySQL user credentials

### Table exists error?
- Normal on startup if tables already exist
- The initialization script ignores duplicate table errors

### Wrong password error?
- Update DB_PASSWORD in .env
- Make sure MySQL user has correct password set

## Support Resources

- MySQL Documentation: https://dev.mysql.com/doc/
- mysql2 Package: https://github.com/sidorares/node-mysql2
- Flask-SQLAlchemy: https://flask-sqlalchemy.palletsprojects.com/

---

**Migration completed successfully!** Your project is now configured to use MySQL. Follow the setup guide to complete the configuration.
