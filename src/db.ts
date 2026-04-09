import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "radiusops.db");
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS hosts (
    id TEXT PRIMARY KEY,
    hostname TEXT NOT NULL,
    owner TEXT NOT NULL,
    device_type TEXT NOT NULL,
    status TEXT NOT NULL,
    fqdn TEXT NOT NULL,
    certSerial TEXT,
    certPassword TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    user TEXT NOT NULL,
    action TEXT NOT NULL,
    hostname TEXT NOT NULL,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tokens (
    token TEXT PRIMARY KEY,
    hostname TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    used INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- 'Admin' or 'IT'
    createdAt TEXT NOT NULL
  );
`);

// Create default admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  db.prepare("INSERT INTO users (username, password, role, createdAt) VALUES (?, ?, ?, ?)")
    .run("admin", "password", "Admin", new Date().toISOString());
}

// Migration: Add certPassword if it doesn't exist
try {
  db.prepare("ALTER TABLE hosts ADD COLUMN certPassword TEXT").run();
} catch (e) {
  // Column already exists or other error
}

export default db;
