// Sıfır bağımlılıklı Node.js static server + basit kısıntı istatistikleri API'si.
// Çalıştırma: node server.js  →  http://localhost:5000

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 5000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const CUTS_FILE = path.join(DATA_DIR, "cuts.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CUTS_FILE)) fs.writeFileSync(CUTS_FILE, "[]", "utf8");

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".css":  "text/css; charset=utf-8",
    ".js":   "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg":  "image/svg+xml",
    ".png":  "image/png",
    ".jpg":  "image/jpeg",
    ".ico":  "image/x-icon",
};

function readCuts() {
    try {
        const raw = fs.readFileSync(CUTS_FILE, "utf8");
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function writeCuts(arr) {
    fs.writeFileSync(CUTS_FILE, JSON.stringify(arr), "utf8");
}

function readBody(req, maxBytes = 64 * 1024) {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];
        req.on("data", (chunk) => {
            size += chunk.length;
            if (size > maxBytes) { req.destroy(); reject(new Error("Body too large")); return; }
            chunks.push(chunk);
        });
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

function sendJson(res, status, payload) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(payload));
}

function statsFromCuts(records) {
    const map = {};
    for (const rec of records) {
        for (const c of (rec.cuts || [])) {
            const cat = c.category;
            const pct = parseFloat(c.percent) || 0;
            if (!cat || pct <= 0) continue;
            if (!map[cat]) map[cat] = { count: 0, sumPct: 0 };
            map[cat].count += 1;
            map[cat].sumPct += pct;
        }
    }
    const total = records.length;
    const categories = Object.keys(map).map((cat) => ({
        category: cat,
        count: map[cat].count,
        avg_percent: map[cat].sumPct / map[cat].count,
        share: total > 0 ? map[cat].count / total : 0
    })).sort((a, b) => b.avg_percent - a.avg_percent);
    return { total_submissions: total, categories };
}

const server = http.createServer(async (req, res) => {
    const parsed = url.parse(req.url);
    let pathname = decodeURIComponent(parsed.pathname);

    // ============ API ============
    if (pathname === "/api/cuts/stats" && req.method === "GET") {
        sendJson(res, 200, statsFromCuts(readCuts()));
        return;
    }

    if (pathname === "/api/cuts" && req.method === "POST") {
        try {
            const body = await readBody(req);
            const payload = body ? JSON.parse(body) : {};
            const incoming = Array.isArray(payload.cuts) ? payload.cuts : [];
            const sanitized = incoming
                .map((c) => ({
                    category: String(c && c.category || "").trim().slice(0, 80),
                    percent: Math.max(0, Math.min(100, parseFloat(c && c.percent) || 0))
                }))
                .filter((c) => c.category && c.percent > 0)
                .slice(0, 30);
            if (sanitized.length === 0) {
                sendJson(res, 400, { error: "Geçerli kısıntı verisi yok" });
                return;
            }
            const records = readCuts();
            records.push({ ts: Date.now(), cuts: sanitized });
            const MAX_RECORDS = 10000;
            if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS);
            writeCuts(records);
            sendJson(res, 200, { ok: true, total: records.length });
        } catch (e) {
            sendJson(res, 400, { error: "Geçersiz istek" });
        }
        return;
    }

    // ============ STATIC ============
    if (pathname === "/") pathname = "/login.html";

    const safePath = path.normalize(pathname).replace(/^([\\\/])+/, "");
    const filePath = path.join(PUBLIC_DIR, safePath);
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403); res.end("Forbidden");
        return;
    }

    fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
            res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
            res.end("<h1>404</h1><p>Sayfa bulunamadı.</p>");
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, "127.0.0.1", () => {
    console.log(`\n  Maddiyat çalışıyor:  http://localhost:${PORT}\n  Demo giriş:          admin / admin\n  Durdurmak için:      Ctrl+C\n`);
});
