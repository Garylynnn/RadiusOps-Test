import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import cookieParser from "cookie-parser";
import forge from "node-forge";
import db from "./src/db.ts";

// Mock PAM for environment where native modules can't be installed
let pam: any = null;
try {
  // In a real VM, this would be: pam = await import("authenticate-pam");
  // But since we can't install it in the container, we use a mock for the preview.
} catch (e) {
  console.log("PAM module not found, using mock authentication");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const session = req.cookies.session;
    if (session) {
      const user = db.prepare("SELECT * FROM users WHERE username = ?").get(session) as any;
      if (user) {
        req.user = user;
        return next();
      }
    }
    res.status(401).json({ error: "Unauthorized" });
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === "Admin") {
      next();
    } else {
      res.status(403).json({ error: "Forbidden: Admin access required" });
    }
  };

  // Auth Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;

    if (user) {
      res.cookie("session", user.username, { httpOnly: true });
      res.json({ success: true, role: user.role });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/logout", (req, res) => {
    res.clearCookie("session");
    res.json({ success: true });
  });

  app.get("/api/me", (req, res) => {
    const session = req.cookies.session;
    if (session) {
      const user = db.prepare("SELECT username, role FROM users WHERE username = ?").get(session) as any;
      if (user) return res.json(user);
    }
    res.status(401).json({ error: "Not logged in" });
  });

  // User Management
  app.get("/api/users", authenticate, isAdmin, (req, res) => {
    const users = db.prepare("SELECT username, role, createdAt FROM users").all();
    res.json(users);
  });

  app.post("/api/users", authenticate, isAdmin, (req, res) => {
    const { username, password, role } = req.body;
    try {
      db.prepare("INSERT INTO users (username, password, role, createdAt) VALUES (?, ?, ?, ?)")
        .run(username, password, role, new Date().toISOString());
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.post("/api/users/change-password", authenticate, (req: any, res) => {
    const { newPassword } = req.body;
    db.prepare("UPDATE users SET password = ? WHERE username = ?").run(newPassword, req.user.username);
    res.json({ success: true });
  });

  app.delete("/api/users/:username", authenticate, isAdmin, (req, res) => {
    if (req.params.username === "admin") return res.status(400).json({ error: "Cannot delete primary admin" });
    db.prepare("DELETE FROM users WHERE username = ?").run(req.params.username);
    res.json({ success: true });
  });

  // API Routes (Protected)
  app.get("/api/hosts", authenticate, (req, res) => {
    const hosts = db.prepare("SELECT * FROM hosts ORDER BY createdAt DESC").all();
    res.json(hosts);
  });

  app.post("/api/hosts", authenticate, (req: any, res) => {
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
    insertLog.run(uuidv4(), createdAt, req.user.username, "Created", hostname, status);

    res.json({ id, hostname, owner, device_type, status, fqdn, createdAt });
  });

  app.post("/api/hosts/:id/approve", authenticate, isAdmin, (req: any, res) => {
    const host = db.prepare("SELECT * FROM hosts WHERE id = ?").get(req.params.id) as any;
    if (host) {
      const status = "Approved";
      db.prepare("UPDATE hosts SET status = ? WHERE id = ?").run(status, req.params.id);
      
      db.prepare(`
        INSERT INTO audit_logs (id, timestamp, user, action, hostname, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), new Date().toISOString(), req.user.username, "Approved", host.hostname, status);

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

  app.post("/api/hosts/:id/revoke", authenticate, isAdmin, (req: any, res) => {
    const host = db.prepare("SELECT * FROM hosts WHERE id = ?").get(req.params.id) as any;
    if (host) {
      const status = "Revoked";
      db.prepare("UPDATE hosts SET status = ? WHERE id = ?").run(status, req.params.id);
      
      db.prepare(`
        INSERT INTO audit_logs (id, timestamp, user, action, hostname, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), new Date().toISOString(), req.user.username, "Revoked", host.hostname, status);

      res.json({ ...host, status });
    } else {
      res.status(404).json({ error: "Host not found" });
    }
  });

  app.get("/api/logs", authenticate, (req, res) => {
    const logs = db.prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC").all();
    res.json(logs);
  });

  app.post("/api/download-token", authenticate, (req, res) => {
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
      
      const host = db.prepare("SELECT * FROM hosts WHERE hostname = ?").get(tokenData.hostname) as any;
      
      db.prepare(`
        INSERT INTO audit_logs (id, timestamp, user, action, hostname, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), new Date().toISOString(), "Agent", "Downloaded", tokenData.hostname, "Success");
      
      // Generate real PKCS#12 certificate
      try {
        const pki = forge.pki;
        const keys = pki.rsa.generateKeyPair(2048);
        const cert = pki.createCertificate();
        
        cert.publicKey = keys.publicKey;
        cert.serialNumber = host?.certSerial || Math.floor(Math.random() * 1000000).toString();
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
        
        const attrs = [{
          name: 'commonName',
          value: tokenData.hostname
        }, {
          name: 'organizationName',
          value: 'RadiusOps Manager'
        }];
        
        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.sign(keys.privateKey);
        
        // Use the password stored in the database, or empty string if none
        const password = host?.certPassword || "";
        
        const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], password, {
          algorithm: '3des'
        });
        const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
        const p12Buffer = Buffer.from(p12Der, 'binary');

        res.setHeader("Content-Disposition", `attachment; filename=${tokenData.hostname}.p12`);
        res.setHeader("Content-Type", "application/x-pkcs12");
        res.send(p12Buffer);
      } catch (err) {
        console.error("Certificate generation failed", err);
        res.status(500).send("Failed to generate certificate");
      }
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
