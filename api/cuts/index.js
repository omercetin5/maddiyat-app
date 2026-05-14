const { addCut } = require("../_kv.js");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }
    try {
        const payload = (req.body && typeof req.body === "object")
            ? req.body
            : JSON.parse(req.body || "{}");
        const incoming = Array.isArray(payload.cuts) ? payload.cuts : [];
        const sanitized = incoming
            .map((c) => ({
                category: String((c && c.category) || "").trim().slice(0, 80),
                percent: Math.max(0, Math.min(100, parseFloat(c && c.percent) || 0))
            }))
            .filter((c) => c.category && c.percent > 0)
            .slice(0, 30);
        if (sanitized.length === 0) {
            return res.status(400).json({ error: "Geçerli kısıntı verisi yok" });
        }
        const total = await addCut({ ts: Date.now(), cuts: sanitized });
        return res.status(200).json({ ok: true, total });
    } catch (e) {
        return res.status(400).json({ error: "Geçersiz istek" });
    }
};
