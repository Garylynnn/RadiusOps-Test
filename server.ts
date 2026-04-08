import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import db from "./src/db.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/hosts", (req, res) => {
    const hosts = db.prepare("SELECT * FROM hosts ORDER BY createdAt DESC").all();
    res.json(hosts);
  });

  app.post("/api/hosts", (req, res) => {
    const { hostname, owner, device_type, certPassword } = req.body;
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const fqdn = `${hostname}.almaradius.ho`;
    const status = "Draft";

    const insertHost = db.prepare(`
      INSERT INTO hosts (id, hostname, owner, device_type, status, fqdn, certPassword, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertHost.run(id, hostname, owner, device_type, status, fqdn, certPassword || null, createdAt);

    const insertLog = db.prepare(`
      INSERT INTO audit_logs (id, timestamp, user, action, hostname, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertLog.run(uuidv4(), createdAt, "IT Operator", "Created", hostname, status);

    res.json({ id, hostname, owner, device_type, status, fqdn, createdAt });
  });

  app.post("/api/hosts/:id/approve", (req, res) => {
    const host = db.prepare("SELECT * FROM hosts WHERE id = ?").get(req.params.id) as any;
    if (host) {
      const status = "Approved";
      db.prepare("UPDATE hosts SET status = ? WHERE id = ?").run(status, req.params.id);
      
      db.prepare(`
        INSERT INTO audit_logs (id, timestamp, user, action, hostname, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), new Date().toISOString(), "IT Auditor", "Approved", host.hostname, status);

      // Simulate Provisioning
      setTimeout(() => {
        const provisionedStatus = "Provisioned";
        const certSerial = Math.random().toString(36).substring(2, 15).toUpperCase();
        
        db.prepare("UPDATE hosts SET status = ?, certSerial = ? WHERE id = ?")
          .run(provisionedStatus, certSerial, req.params.id);
        
        db.prepare(`
          INSERT INTO audit_logs (id, timestamp, user, action, hostname, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), new Date().toISOString(), "System", "Provisioned", host.hostname, provisionedStatus);
      }, 2000);

      res.json({ ...host, status });
    } else {
      res.status(404).json({ error: "Host not found" });
    }
  });

  app.post("/api/hosts/:id/revoke", (req, res) => {
    const host = db.prepare("SELECT * FROM hosts WHERE id = ?").get(req.params.id) as any;
    if (host) {
      const status = "Revoked";
      db.prepare("UPDATE hosts SET status = ? WHERE id = ?").run(status, req.params.id);
      
      db.prepare(`
        INSERT INTO audit_logs (id, timestamp, user, action, hostname, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), new Date().toISOString(), "IT Operator", "Revoked", host.hostname, status);

      res.json({ ...host, status });
    } else {
      res.status(404).json({ error: "Host not found" });
    }
  });

  app.get("/api/logs", (req, res) => {
    const logs = db.prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC").all();
    res.json(logs);
  });

  app.post("/api/download-token", (req, res) => {
    const { hostname } = req.body;
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    
    db.prepare("INSERT INTO tokens (token, hostname, expiresAt) VALUES (?, ?, ?)")
      .run(token, hostname, expiresAt);
      
    res.json({ token });
  });

  app.get("/api/download/:token", (req, res) => {
    const tokenData = db.prepare("SELECT * FROM tokens WHERE token = ? AND used = 0").get(req.params.token) as any;
    
    if (tokenData && new Date(tokenData.expiresAt) > new Date()) {
      db.prepare("UPDATE tokens SET used = 1 WHERE token = ?").run(req.params.token);
      
      db.prepare(`
        INSERT INTO audit_logs (id, timestamp, user, action, hostname, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), new Date().toISOString(), "Agent", "Downloaded", tokenData.hostname, "Success");
      
      res.setHeader("Content-Disposition", `attachment; filename=${tokenData.hostname}.p12`);
      res.send(Buffer.from("MOCK_P12_CONTENT"));
    } else {
      res.status(404).send("Invalid or expired token");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
