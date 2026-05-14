const { getCuts } = require("../_kv.js");

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

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Method not allowed" });
    }
    const records = await getCuts();
    return res.status(200).json(statsFromCuts(records));
};
