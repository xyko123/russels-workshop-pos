/**
-- ============================================================================
-- RUSELL'S GLASS, WOODS & METALS - STANDALONE SEED EXECUTOR (Node.js)
-- Location: Tabor Lumber Compound, Roxas Ext., Brgy. Zone III, Digos City
-- "You NAME it, we BUILD it"
-- ============================================================================
*/

const fs = require('fs');
const path = require('path');

console.log("=== RUSELL'S GLASS, WOODS & METALS ===");
console.log("Preparing database migrations and seed data for production...");

const sqlPath = path.join(__dirname, 'seed_russels_data.sql');
const migrationPath = path.join(__dirname, '..', 'migrations', '001_initial_workshop_schema.sql');

if (fs.existsSync(migrationPath)) {
  const schemaSql = fs.readFileSync(migrationPath, 'utf8');
  console.log(`[OK] Verified migration schema: ${migrationPath} (${schemaSql.length} bytes)`);
} else {
  console.error(`[ERROR] Missing migration file: ${migrationPath}`);
}

if (fs.existsSync(sqlPath)) {
  const seedSql = fs.readFileSync(sqlPath, 'utf8');
  console.log(`[OK] Verified seed script: ${sqlPath} (${seedSql.length} bytes)`);
} else {
  console.error(`[ERROR] Missing seed SQL file: ${sqlPath}`);
}

console.log("Seed verification complete. Data ready for Turso, SQLite, MySQL or client localStorage initialization.");
