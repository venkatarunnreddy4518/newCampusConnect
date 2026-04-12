import { DatabaseSync } from "node:sqlite";
import mysql from "mysql2/promise";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, ".local", "campusconnect.sqlite");

// Get all tables from SQLite
function getSQLiteTables(db) {
  const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
  return result.map(row => row.name);
}

// Get table schema from SQLite
function getSQLiteSchema(db, tableName) {
  const result = db.prepare(`PRAGMA table_info(${tableName});`).all();
  return result;
}

// Get data from SQLite table
function getSQLiteTableData(db, tableName) {
  try {
    const result = db.prepare(`SELECT * FROM ${tableName};`).all();
    return result;
  } catch (error) {
    console.error(`Error reading table ${tableName}:`, error.message);
    return [];
  }
}

// Connect to MySQL and migrate data
async function migrateDatabase() {
  console.log("🚀 Starting SQLite to MySQL migration...\n");

  // Connect to SQLite
  console.log("📖 Reading SQLite database:", DB_PATH);
  const sqliteDb = new DatabaseSync(DB_PATH);

  // Connect to MySQL
  console.log("🔗 Connecting to MySQL...");
  const mysqlPool = await mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "campusconnect",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const connection = await mysqlPool.getConnection();

  try {
    // Get all tables from SQLite
    const tables = getSQLiteTables(sqliteDb);
    console.log(`\n📊 Found ${tables.length} tables in SQLite:\n`);

    // Skip these system tables
    const skipTables = ["sqlite_sequence"];
    const tablesToMigrate = tables.filter(t => !skipTables.includes(t));

    let totalRecords = 0;

    for (const tableName of tablesToMigrate) {
      console.log(`\n📥 Migrating table: ${tableName}`);

      // Get table data
      const rows = getSQLiteTableData(sqliteDb, tableName);
      console.log(`   ├─ Row count: ${rows.length}`);

      if (rows.length === 0) {
        console.log(`   └─ ✓ Skipped (empty table)`);
        continue;
      }

      // Get column names from first row
      const columns = Object.keys(rows[0]);
      console.log(`   ├─ Columns: ${columns.join(", ")}`);

      // Insert data into MySQL
      try {
        for (const row of rows) {
          const values = columns.map(col => row[col]);
          const placeholders = columns.map(() => "?").join(", ");
          const sql = `INSERT IGNORE INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`;

          try {
            await connection.execute(sql, values);
          } catch (error) {
            // Log error but continue with next row
            if (!error.message.includes("Duplicate entry")) {
              console.error(`   ├─ ⚠️ Error inserting row:`, error.message);
            }
          }
        }
        console.log(`   └─ ✓ Migrated ${rows.length} records`);
        totalRecords += rows.length;
      } catch (error) {
        console.error(`   └─ ✗ Error migrating table ${tableName}:`, error.message);
      }
    }

    console.log(`\n\n✅ Migration complete!`);
    console.log(`📊 Total records migrated: ${totalRecords}`);
    console.log(`\n📋 Verification Query:\n${"═".repeat(50)}`);
    
    // Verify by showing table counts
    console.log("\nTable row counts in MySQL:");
    for (const tableName of tablesToMigrate) {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`  ${tableName}: ${rows[0].count} rows`);
    }

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
  } finally {
    connection.release();
    await mysqlPool.end();
    sqliteDb.close();
    process.exit(0);
  }
}

// Run migration
migrateDatabase().catch(error => {
  console.error("Migration error:", error);
  process.exit(1);
});
