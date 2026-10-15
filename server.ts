import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const BACKUPS_FILE_PATH = path.join(process.cwd(), "cloud_backups.json");
const TMP_BACKUPS_FILE_PATH = "/tmp/cloud_backups.json";
const PINS_FILE_PATH = path.join(process.cwd(), "cloud_pins.json");
const TMP_PINS_FILE_PATH = "/tmp/cloud_pins.json";

// In-memory caches for ultra-speed sync, initialized from disk
let backupsCache: { [email: string]: any } = {};
let pinsCache: { [pin: string]: { pin: string; email: string; backup: any; createdAt: string } } = {};

const loadBackupsFromDisk = () => {
  try {
    if (fs.existsSync(BACKUPS_FILE_PATH)) {
      const rawData = fs.readFileSync(BACKUPS_FILE_PATH, "utf-8");
      backupsCache = JSON.parse(rawData);
    } else if (fs.existsSync(TMP_BACKUPS_FILE_PATH)) {
      const rawData = fs.readFileSync(TMP_BACKUPS_FILE_PATH, "utf-8");
      backupsCache = JSON.parse(rawData);
    }
  } catch (err) {
    console.error("Error reading backups from disk:", err);
  }

  try {
    if (fs.existsSync(PINS_FILE_PATH)) {
      const rawPins = fs.readFileSync(PINS_FILE_PATH, "utf-8");
      pinsCache = JSON.parse(rawPins);
    } else if (fs.existsSync(TMP_PINS_FILE_PATH)) {
      const rawPins = fs.readFileSync(TMP_PINS_FILE_PATH, "utf-8");
      pinsCache = JSON.parse(rawPins);
    }
  } catch (err) {
    console.error("Error reading pins from disk:", err);
  }
};

loadBackupsFromDisk();

// Function to save backups dictionary to disk
const saveBackupsToDisk = () => {
  try {
    const data = JSON.stringify(backupsCache, null, 2);
    fs.writeFileSync(BACKUPS_FILE_PATH, data, "utf-8");
    try { fs.writeFileSync(TMP_BACKUPS_FILE_PATH, data, "utf-8"); } catch (_) {}
  } catch (err) {
    console.error("Error writing backups dictionary to disk:", err);
  }
};

const savePinsToDisk = () => {
  try {
    const data = JSON.stringify(pinsCache, null, 2);
    fs.writeFileSync(PINS_FILE_PATH, data, "utf-8");
    try { fs.writeFileSync(TMP_PINS_FILE_PATH, data, "utf-8"); } catch (_) {}
  } catch (err) {
    console.error("Error writing pins to disk:", err);
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json({ limit: "25mb" }));

  // CORS middleware for multi-device cross-origin support
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health and ping endpoint
  app.get("/api/backup/ping", (_req, res) => {
    res.json({
      success: true,
      status: "online",
      serverTime: new Date().toISOString(),
      cachedAccounts: Object.keys(backupsCache).length,
      activePins: Object.keys(pinsCache).length
    });
  });

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
      
      loadBackupsFromDisk();
      const normalizedEmail = email.toLowerCase().trim();
      const userBackup = backupsCache[normalizedEmail];
      
      if (!userBackup || !userBackup.backup) {
        res.json({ 
          success: false, 
          notFound: true, 
          error: "Nenhum backup encontrado na nuvem para este e-mail" 
        });
        return;
      }
      
      res.json({ 
        success: true, 
        notFound: false,
        updatedAt: userBackup.updatedAt,
        backup: userBackup.backup 
      });
    } catch (err: any) {
      console.error("Fail in loading backup API:", err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });

  // Query status/metadata of cloud backup without loading full payload
  app.get("/api/backup/status/:email", (req, res) => {
    try {
      const email = req.params.email;
      if (!email || !email.includes("@")) {
        res.status(400).json({ success: false, error: "Invalid email address" });
        return;
      }

      loadBackupsFromDisk();
      const normalizedEmail = email.toLowerCase().trim();
      const userBackup = backupsCache[normalizedEmail];

      if (!userBackup || !userBackup.backup) {
        res.json({ 
          success: true, 
          exists: false 
        });
        return;
      }

      const backup = userBackup.backup;
      res.json({
        success: true,
        exists: true,
        updatedAt: userBackup.updatedAt || backup.timestamp,
        driverName: backup.profile?.name || "Motorista",
        vehiclePlate: backup.vehicle?.licensePlate || backup.vehicle?.plate || "",
        shiftsCount: Array.isArray(backup.shifts) ? backup.shifts.length : 0,
        expensesCount: Array.isArray(backup.expenses) ? backup.expenses.length : 0,
        maintenanceCount: Array.isArray(backup.maintenance) ? backup.maintenance.length : 0
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });

  // 6-DIGIT QUICK SYNC PIN GENERATION
  app.post("/api/backup/pin/generate", (req, res) => {
    try {
      const { email, backup } = req.body;
      if (!backup) {
        res.status(400).json({ success: false, error: "Dados de backup ausentes" });
        return;
      }

      // Generate a random 6-digit numeric PIN
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const normalizedEmail = (email || "motorista@gmc.com").toLowerCase().trim();

      const pinRecord = {
        pin,
        email: normalizedEmail,
        backup,
        createdAt: new Date().toISOString()
      };

      pinsCache[pin] = pinRecord;
      savePinsToDisk();

      // Also persist to email cache
      if (normalizedEmail.includes("@")) {
        backupsCache[normalizedEmail] = {
          updatedAt: pinRecord.createdAt,
          backup
        };
        saveBackupsToDisk();
      }

      console.log(`Generated Quick Sync PIN ${pin} for ${normalizedEmail}.`);
      res.json({
        success: true,
        pin,
        createdAt: pinRecord.createdAt,
        shiftsCount: backup.shifts?.length || 0,
        expensesCount: backup.expenses?.length || 0
      });
    } catch (err: any) {
      console.error("Error generating sync PIN:", err);
      res.status(500).json({ success: false, error: err.message || "Erro ao gerar PIN" });
    }
  });

  // 6-DIGIT QUICK SYNC PIN LOAD
  app.get("/api/backup/pin/load/:pin", (req, res) => {
    try {
      const rawPin = req.params.pin || "";
      const cleanPin = rawPin.replace(/[^0-9]/g, "");

      loadBackupsFromDisk();
      const pinRecord = pinsCache[cleanPin];

      if (!pinRecord || !pinRecord.backup) {
        res.json({ 
          success: false, 
          notFound: true,
          error: `PIN "${cleanPin}" não encontrado ou expirado. Verifique o número digitado ou gere um novo PIN no tablet.` 
        });
        return;
      }

      res.json({
        success: true,
        notFound: false,
        pin: cleanPin,
        email: pinRecord.email,
        updatedAt: pinRecord.createdAt,
        backup: pinRecord.backup
      });
    } catch (err: any) {
      console.error("Error loading sync PIN:", err);
      res.status(500).json({ success: false, error: err.message || "Erro ao consultar PIN" });
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
