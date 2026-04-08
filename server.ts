import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Database
  const dbPath = path.join(__dirname, "mock-db.json");
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({
      hosts: [],
      logs: [],
      tokens: []
    }));
  }

  const getDB = () => JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  const saveDB = (data: any) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

  // API Routes
  app.get("/api/hosts", (req, res) => {
    const db = getDB();
    res.json(db.hosts);
  });

  app.post("/api/hosts", (req, res) => {
    const db = getDB();
    const newHost = {
      id: uuidv4(),
      ...req.body,
      status: "Draft",
      createdAt: new Date().toISOString(),
      fqdn: `${req.body.hostname}.almaradius.ho`
    };
    db.hosts.push(newHost);
    
    db.logs.push({
      id: uuidv4(),
      user: "IT Operator",
      hostname: newHost.hostname,
      action: "Created",
      timestamp: new Date().toISOString(),
      ip: req.ip
    });

    saveDB(db);
    res.json(newHost);
  });

  app.post("/api/hosts/:id/approve", (req, res) => {
    const db = getDB();
    const host = db.hosts.find((h: any) => h.id === req.params.id);
    if (host) {
      host.status = "Approved";
      
      db.logs.push({
        id: uuidv4(),
        user: "IT Auditor",
        hostname: host.hostname,
        action: "Approved",
        timestamp: new Date().toISOString(),
        ip: req.ip
      });

      // Simulate Provisioning
      setTimeout(() => {
        const currentDB = getDB();
        const currentHost = currentDB.hosts.find((h: any) => h.id === req.params.id);
        if (currentHost) {
          currentHost.status = "Provisioned";
          currentHost.certSerial = Math.random().toString(36).substring(2, 15).toUpperCase();
          currentHost.expiryDate = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(); // 2 years
          
          currentDB.logs.push({
            id: uuidv4(),
            user: "System",
            hostname: currentHost.hostname,
            action: "Provisioned",
            timestamp: new Date().toISOString(),
            ip: "127.0.0.1"
          });
          saveDB(currentDB);
        }
      }, 2000);

      saveDB(db);
      res.json(host);
    } else {
      res.status(404).json({ error: "Host not found" });
    }
  });

  app.post("/api/hosts/:id/revoke", (req, res) => {
    const db = getDB();
    const host = db.hosts.find((h: any) => h.id === req.params.id);
    if (host) {
      host.status = "Revoked";
      db.logs.push({
        id: uuidv4(),
        user: "IT Operator",
        hostname: host.hostname,
        action: "Revoked",
        timestamp: new Date().toISOString(),
        ip: req.ip
      });
      saveDB(db);
      res.json(host);
    } else {
      res.status(404).json({ error: "Host not found" });
    }
  });

  app.get("/api/logs", (req, res) => {
    const db = getDB();
    res.json(db.logs);
  });

  app.post("/api/download-token", (req, res) => {
    const { hostname } = req.body;
    const token = uuidv4();
    const db = getDB();
    db.tokens.push({
      token,
      hostname,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 mins
      used: false
    });
    saveDB(db);
    res.json({ token });
  });

  app.get("/api/download/:token", (req, res) => {
    const db = getDB();
    const tokenData = db.tokens.find((t: any) => t.token === req.params.token && !t.used && new Date(t.expiresAt) > new Date());
    
    if (tokenData) {
      tokenData.used = true;
      db.logs.push({
        id: uuidv4(),
        user: "Agent",
        hostname: tokenData.hostname,
        action: "Downloaded",
        timestamp: new Date().toISOString(),
        ip: req.ip
      });
      saveDB(db);
      
      // Send a mock P12 file
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
