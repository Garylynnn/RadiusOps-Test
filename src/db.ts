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
`);

export default db;
