# MySQL Migration - Quick Start

## 5-Minute Setup

### Step 1: Create `.env` file
Create a new file `.env` in the project root with your MySQL credentials:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=campusconnect
FLASK_SECRET_KEY=dev-key-12345
```

### Step 2: Create MySQL Database
```bash
mysql -h localhost -u root -p

# In MySQL prompt:
CREATE DATABASE campusconnect;
EXIT;
```

### Step 3: Install Dependencies
```bash
npm install
cd backend_flask
pip install -r requirements.txt
cd ..
```

### Step 4: Start the Application
```bash
npm run dev
```

The application will:
- ✅ Create tables automatically
- ✅ Connect to MySQL on localhost:3306
- ✅ Start Node.js server on port 3001
- ✅ Start Vite web server on port 5173
- ✅ Start Flask on port 5000

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` | Start MySQL: `mysql.server start` on Mac or MySQL Service on Windows |
| `Access denied for user 'root'@'localhost'` | Check `DB_PASSWORD` in `.env` |
| `Unknown database 'campusconnect'` | Run: `mysql -u root -p -e "CREATE DATABASE campusconnect;"` |
| `Tables already exist` | This is normal, initialization script ignores duplicates |

## Verify Setup

```bash
# Check MySQL
mysql -h localhost -u root -p -e "USE campusconnect; SHOW TABLES;"

# Check Node.js Server
curl http://localhost:3001/api/health

# Check Flask  
curl http://127.0.0.1:5000/health

# Check Frontend
Open http://localhost:5173 in browser
```

## Detailed Guides

- Full setup guide: See `MYSQL_SETUP_GUIDE.md`
- Migration details: See `MIGRATION_SUMMARY.md`

---

**That's it!** You're ready to develop with MySQL. 🚀
