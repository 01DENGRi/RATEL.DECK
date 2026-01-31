import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
const PORT = 3001;

// =======================
// DATABASE PATHS
// =======================

const CVE_DB_PATH = path.resolve("./database.json");
const CHEATS_DB_PATH = path.resolve("./cheatsheets.json");

// =======================
// MIDDLEWARE
// =======================

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// =======================
// CVE DATABASE
// =======================

app.get("/loadDatabase", (req, res) => {
  try {
    if (!fs.existsSync(CVE_DB_PATH)) {
      return res.json([]);
    }
    res.json(JSON.parse(fs.readFileSync(CVE_DB_PATH, "utf-8")));
  } catch (e) {
    res.status(500).json({ error: "CVE load failed" });
  }
});

app.post("/saveDatabase", (req, res) => {
  try {
    const data = Array.isArray(req.body)
      ? req.body
      : req.body?.data || req.body?.cves;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "Invalid CVE payload" });
    }

    fs.writeFileSync(CVE_DB_PATH, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "CVE save failed" });
  }
});

// =======================
// CHEAT SHEETS DATABASE
// =======================

app.get("/loadCheatSheets", (req, res) => {
  try {
    if (!fs.existsSync(CHEATS_DB_PATH)) {
      return res.json([]);
    }
    res.json(JSON.parse(fs.readFileSync(CHEATS_DB_PATH, "utf-8")));
  } catch (e) {
    res.status(500).json({ error: "CheatSheets load failed" });
  }
});

app.post("/saveCheatSheets", (req, res) => {
  try {
    const data =
      Array.isArray(req.body)
        ? req.body
        : req.body?.data
        || req.body?.cheatSheets
        || req.body?.items;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "Invalid CheatSheets payload" });
    }

    fs.writeFileSync(CHEATS_DB_PATH, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "CheatSheets save failed" });
  }
});

// =======================
// PROFILE DATABASE (PER-PROFILE JSON FILES)
// =======================

// small hardening (safe filenames)
const sanitizeProfileName = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-");

// fix path to always be relative to backend folder
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const getProfilePath = (profileName) =>
  path.join(__dirname, `profile-${sanitizeProfileName(profileName)}.json`);

// LOAD PROFILE
app.get("/loadProfile", (req, res) => {
  try {
    const profileName = req.query.profileName;
    if (!profileName) {
      return res.status(400).json({ error: "Missing profileName" });
    }

    const filePath = getProfilePath(profileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "NO_DATABASE" });
    }

    res.json(JSON.parse(fs.readFileSync(filePath, "utf-8")));
  } catch (e) {
    res.status(500).json({ error: "Profile load failed" });
  }
});

// SAVE PROFILE
app.post("/saveProfile", (req, res) => {
  try {
    const { profileName, data } = req.body;

    if (!profileName) {
      return res.status(400).json({ error: "Missing profileName" });
    }

    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Invalid profile payload" });
    }

    const filePath = getProfilePath(profileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "NO_DATABASE" });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Profile save failed" });
  }
});

// =======================
// SERVER START
// =======================

app.listen(PORT, () => {
  console.log(`✅ Backend running → http://localhost:${PORT}`);
});
