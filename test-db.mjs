import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('.local/campusconnect.sqlite');

console.log('\n📋 DATABASE SCHEMA CHECK\n');

// Check tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('✓ All tables:', tables.map(t => t.name).join(', '));

// Check WhatsApp tables specifically
const whatsappTables = tables.filter(t => t.name.includes('whatsapp'));
console.log('\n✓ WhatsApp tables found:', whatsappTables.length);
whatsappTables.forEach(t => console.log(`  - ${t.name}`));

// Check events table has enable_whatsapp column
const columns = db.prepare("PRAGMA table_info(events)").all();
const hasWhatsAppColumn = columns.some(c => c.name === 'enable_whatsapp');
console.log(`\n✓ events.enable_whatsapp column exists: ${hasWhatsAppColumn}`);

// Check whatsapp_messages schema
if (whatsappTables.some(t => t.name === 'whatsapp_messages')) {
  const messageColumns = db.prepare("PRAGMA table_info(whatsapp_messages)").all();
  console.log('\n✓ whatsapp_messages columns:');
  messageColumns.forEach(c => console.log(`  - ${c.name} (${c.type})`));
}

// Count existing records
console.log('\n📊 RECORD COUNTS');
const eventCount = db.prepare("SELECT COUNT(*) as count FROM events").get();
console.log(`  Events: ${eventCount.count}`);

const whatsappMsgCount = db.prepare("SELECT COUNT(*) as count FROM whatsapp_messages").get();
console.log(`  WhatsApp messages: ${whatsappMsgCount.count}`);

console.log('\n✅ Database schema verified!\n');
db.close();
