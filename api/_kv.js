// Upstash Redis REST API üzerinden kalıcı saklama (sıfır bağımlılık).
// Vercel'de Upstash/KV entegrasyonu kurulunca aşağıdaki env var'lardan biri otomatik gelir:
//   KV_REST_API_URL + KV_REST_API_TOKEN
//   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN

const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const CUTS_KEY = "maddiyat:cuts";
const MAX_RECORDS = 10000;

function hasStore() {
    return Boolean(REST_URL && REST_TOKEN);
}

async function redis(...command) {
    const res = await fetch(REST_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${REST_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(command)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`KV error ${res.status}: ${text}`);
    }
    const data = await res.json();
    return data.result;
}

async function getCuts() {
    if (!hasStore()) return [];
    try {
        const items = await redis("LRANGE", CUTS_KEY, 0, -1);
        return (items || []).map((s) => {
            try { return typeof s === "string" ? JSON.parse(s) : s; } catch { return null; }
        }).filter(Boolean);
    } catch (e) {
        return [];
    }
}

async function addCut(record) {
    if (!hasStore()) return 0;
    await redis("RPUSH", CUTS_KEY, JSON.stringify(record));
    await redis("LTRIM", CUTS_KEY, -MAX_RECORDS, -1);
    const len = await redis("LLEN", CUTS_KEY);
    return parseInt(len) || 0;
}

module.exports = { getCuts, addCut, hasStore };
