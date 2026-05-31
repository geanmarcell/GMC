import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const BACKUPS_FILE_PATH = path.join(process.cwd(), "cloud_backups.json");

// In-memory cache for ultra-speed sync, initialized from disk
let backupsCache: { [email: string]: any } = {};
try {
  if (fs.existsSync(BACKUPS_FILE_PATH)) {
    const rawData = fs.readFileSync(BACKUPS_FILE_PATH, "utf-8");
    backupsCache = JSON.parse(rawData);
    console.log("Loaded backups dictionary from disk.");
  }
} catch (err) {
  console.error("Error loading backups from disk:", err);
}

// Function to save backups dictionary to disk
const saveBackupsToDisk = () => {
  try {
    fs.writeFileSync(BACKUPS_FILE_PATH, JSON.stringify(backupsCache, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing backups dictionary to disk:", err);
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json({ limit: "20mb" }));

  // API endpoints

  // Save/Upload backup endpoint
  app.post("/api/backup/save", (req, res) => {
    try {
      const { email, backup } = req.body;
      if (!email || !email.includes("@")) {
        res.status(400).json({ success: false, error: "Invalid email payload" });
        return;
      }
      if (!backup) {
        res.status(400).json({ success: false, error: "Invalid backup payload" });
        return;
      }
      
      const normalizedEmail = email.toLowerCase().trim();
      backupsCache[normalizedEmail] = {
        updatedAt: new Date().toISOString(),
        backup
      };
      
      saveBackupsToDisk();
      
      console.log(`Successfully persisted backup to cloud for ${normalizedEmail}.`);
      res.json({ 
        success: true, 
        message: "Backup saved successfully", 
        timestamp: backupsCache[normalizedEmail].updatedAt 
      });
    } catch (err: any) {
      console.error("Fail in saving backup API:", err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });

  // Load/Download backup endpoint
  app.get("/api/backup/load/:email", (req, res) => {
    try {
      const email = req.params.email;
      if (!email || !email.includes("@")) {
        res.status(400).json({ success: false, error: "Invalid email address" });
        return;
      }
      
      const normalizedEmail = email.toLowerCase().trim();
      const userBackup = backupsCache[normalizedEmail];
      
      if (!userBackup) {
        res.status(404).json({ success: false, error: "No backup found for this account" });
        return;
      }
      
      res.json({ 
        success: true, 
        updatedAt: userBackup.updatedAt,
        backup: userBackup.backup 
      });
    } catch (err: any) {
      console.error("Fail in loading backup API:", err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });

  // Vite middleware for development or Static server for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
