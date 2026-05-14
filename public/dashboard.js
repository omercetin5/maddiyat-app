const DEFAULT_EXPENSES = [
    "Kira / Konut",
    "Faturalar (Elektrik/Su/Gaz)",
    "İnternet & Telefon",
    "Market / Gıda",
    "Dışarıda Yemek",
    "Ulaşım / Yakıt",
    "Sağlık",
    "Eğitim",
    "Eğlence",
    "Giyim",
    "Abonelikler (Netflix vb.)",
    "Diğer"
];

const fmt = (n) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.round(n || 0)) + " ₺";
const fmtPct = (n) => "%" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(n || 0);

const charts = {};

// ============== ANALYSIS (tarayıcıda hesaplama) ==============

function analyze(payload) {
    const incomes = payload.incomes || [];
    const expenses = payload.expenses || [];
    const investmentPct = parseFloat(payload.investment_pct) || 0;
    const cutTargets = payload.cut_targets || [];
    const investmentMonths = Math.max(1, Math.min(600, parseInt(payload.investment_months) || 12));
    const priceTarget = parseFloat(payload.price_target) || 0;

    const totalIncome = incomes.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const totalExpense = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const investmentAmount = totalIncome * (investmentPct / 100);
    const netCash = totalIncome - totalExpense - investmentAmount;

    const cutsByCategory = {};
    let savedTotal = 0;
    for (const cut of cutTargets) {
        const cat = cut.category;
        const pct = parseFloat(cut.percent) || 0;
        const exp = expenses.find(e => e.category === cat);
        const catAmount = exp ? (parseFloat(exp.amount) || 0) : 0;
        const saved = catAmount * (pct / 100);
        cutsByCategory[cat] = saved;
        savedTotal += saved;
    }

    const projectedExpense = totalExpense - savedTotal;
    const projectedNet = totalIncome - projectedExpense - investmentAmount;

    const months = Array.from({ length: investmentMonths }, (_, i) => i + 1);
    const cumulativeInvest = months.map(m => investmentAmount * m);
    const cumulativeSave = months.map(m => Math.max(netCash, 0) * m);
    const cumulativeSaveImproved = months.map(m => Math.max(projectedNet, 0) * m);

    const yearlyInvest = investmentAmount * 12;
    const yearlySave = Math.max(netCash, 0) * 12;
    const yearlySaveImproved = Math.max(projectedNet, 0) * 12;
    const horizonInvest = investmentAmount * investmentMonths;

    const savingsRate = totalIncome > 0 ? (netCash / totalIncome * 100) : 0;
    const expenseRate = totalIncome > 0 ? (totalExpense / totalIncome * 100) : 0;

    const insights = [];
    if (totalIncome <= 0) {
        insights.push("Henüz gelir bilgisi girilmedi. Analiz yapılabilmesi için en az bir gelir kalemi ekleyin.");
    } else {
        if (totalExpense > totalIncome) {
            insights.push(`Giderleriniz gelirinizi ${fmt(totalExpense - totalIncome)} aşıyor. Acilen kısıntı yapılması önerilir.`);
        }
        if (savingsRate < 10 && totalIncome > 0) {
            insights.push(`Tasarruf oranınız ${fmtPct(savingsRate)}. Uzmanlar gelirin en az %20'sinin tasarruf edilmesini önerir.`);
        } else if (savingsRate >= 20) {
            insights.push(`Tebrikler! Tasarruf oranınız ${fmtPct(savingsRate)} — sağlıklı bir bütçe yönetimi.`);
        }
        if (investmentPct > 0) {
            insights.push(`Aylık ${fmt(investmentAmount)} yatırım, yıllık ${fmt(yearlyInvest)} tutara denk gelir.`);
            insights.push(`${investmentMonths} ay boyunca toplam ${fmt(horizonInvest)} biriktirmeyi hedefliyorsunuz (getirisiz, sade toplam).`);
        }
        if (savedTotal > 0) {
            insights.push(`Kısıntılarla aylık ${fmt(savedTotal)} ek tasarruf, yıllık ${fmt(savedTotal * 12)} kazanç sağlar.`);
        }
        // Bileşik getiri tahmini (seçilen süre boyunca)
        let horizonBalance = 0;
        if (investmentAmount > 0) {
            const annualReturn = 0.20; // %20 yıllık tahmini getiri (TR koşulları için kabaca)
            const monthlyReturn = annualReturn / 12;
            for (let m = 0; m < investmentMonths; m++) {
                horizonBalance = (horizonBalance + investmentAmount) * (1 + monthlyReturn);
            }
            const yearsLabel = investmentMonths >= 12
                ? `${(investmentMonths/12).toFixed(investmentMonths % 12 === 0 ? 0 : 1)} yıl (${investmentMonths} ay)`
                : `${investmentMonths} ay`;
            insights.push(`${yearsLabel} boyunca aylık ${fmt(investmentAmount)} yatırırsanız (%${(annualReturn*100).toFixed(0)} yıllık getiri varsayımıyla) yaklaşık ${fmt(horizonBalance)} biriktirebilirsiniz.`);
        }
        // Fiyat hedefi analizi
        if (priceTarget > 0) {
            if (investmentAmount <= 0) {
                insights.push(`Fiyat hedefiniz ${fmt(priceTarget)} ancak henüz aylık yatırım planlanmadı. Hedefe ulaşmak için yatırım yüzdesini artırın.`);
            } else {
                const annualReturn = 0.20;
                const monthlyReturn = annualReturn / 12;
                // Bileşik getiri ile hedefe ulaşma süresi: FV = P * ((1+r)^n - 1) / r
                const ratio = (priceTarget * monthlyReturn) / investmentAmount + 1;
                const monthsToTarget = Math.ceil(Math.log(ratio) / Math.log(1 + monthlyReturn));
                if (horizonBalance >= priceTarget) {
                    const surplus = horizonBalance - priceTarget;
                    insights.push(`Tebrikler! ${investmentMonths}. ay sonunda fiyat hedefiniz ${fmt(priceTarget)} aşılıyor (yaklaşık ${fmt(surplus)} fazla birikim).`);
                } else {
                    const shortfall = priceTarget - horizonBalance;
                    insights.push(`Seçilen ${investmentMonths} ayda hedefe ${fmt(shortfall)} eksik kalıyor. Aynı tempoyla hedefe yaklaşık ${monthsToTarget} ayda ulaşırsınız.`);
                }
            }
        }
    }

    return {
        totals: {
            income: totalIncome,
            expense: totalExpense,
            investment: investmentAmount,
            net: netCash,
            projected_expense: projectedExpense,
            projected_net: projectedNet,
            saved_total: savedTotal,
            savings_rate: savingsRate,
            expense_rate: expenseRate,
            yearly_invest: yearlyInvest,
            yearly_save: yearlySave,
            yearly_save_improved: yearlySaveImproved,
            investment_months: investmentMonths,
            price_target: priceTarget,
            horizon_invest: horizonInvest
        },
        income_breakdown: incomes.map(i => ({ source: i.source, amount: parseFloat(i.amount) || 0 })),
        expense_breakdown: expenses.map(e => ({ category: e.category, amount: parseFloat(e.amount) || 0 })),
        cuts_by_category: cutsByCategory,
        projection: {
            months,
            investment: cumulativeInvest,
            savings_current: cumulativeSave,
            savings_improved: cumulativeSaveImproved
        },
        insights
    };
}

// ============== DYNAMIC INPUT BUILDERS ==============

function buildIncomeRow(source = "", amount = "") {
    const row = document.createElement("div");
    row.className = "dyn-row income-row";
    row.innerHTML = `
        <input type="text" class="income-source" placeholder="Kaynak (örn. Maaş)" value="${source}">
        <input type="number" class="income-amount" placeholder="Aylık miktar (₺)" min="0" step="100" value="${amount}">
        <button type="button" class="btn-icon" title="Kaldır">✕</button>
    `;
    row.querySelector(".btn-icon").addEventListener("click", () => {
        row.remove();
        updateInvestmentPreview();
    });
    row.querySelector(".income-amount").addEventListener("input", updateInvestmentPreview);
    return row;
}

function buildExpenseRow(category) {
    const row = document.createElement("div");
    row.className = "expense-row";
    row.innerHTML = `
        <span class="cat-name">${category}</span>
        <input type="number" class="expense-amount" placeholder="₺" min="0" step="50" data-category="${category}">
        <button type="button" class="btn-icon" title="Kaldır">✕</button>
    `;
    row.querySelector(".btn-icon").addEventListener("click", () => {
        row.remove();
        rebuildCutOptions();
    });
    row.querySelector(".expense-amount").addEventListener("input", rebuildCutOptions);
    return row;
}

function buildCustomExpenseRow() {
    const row = document.createElement("div");
    row.className = "expense-row";
    row.innerHTML = `
        <input type="text" class="cat-name-input" placeholder="Kategori adı">
        <input type="number" class="expense-amount" placeholder="₺" min="0" step="50">
        <button type="button" class="btn-icon" title="Kaldır">✕</button>
    `;
    const nameInput = row.querySelector(".cat-name-input");
    const amountInput = row.querySelector(".expense-amount");
    const sync = () => {
        amountInput.dataset.category = nameInput.value.trim() || "Özel kategori";
        rebuildCutOptions();
    };
    nameInput.addEventListener("input", sync);
    amountInput.addEventListener("input", rebuildCutOptions);
    row.querySelector(".btn-icon").addEventListener("click", () => {
        row.remove();
        rebuildCutOptions();
    });
    sync();
    return row;
}

function buildCutRow(category, amount) {
    const row = document.createElement("div");
    row.className = "cut-row";
    row.innerHTML = `
        <label><input type="checkbox" class="cut-enable"> <strong>${category}</strong></label>
        <span class="muted small">Mevcut: ${fmt(amount)}/ay</span>
        <input type="number" class="pct-input" min="0" max="100" value="20" disabled>
    `;
    const cb = row.querySelector(".cut-enable");
    const pct = row.querySelector(".pct-input");
    cb.addEventListener("change", () => {
        pct.disabled = !cb.checked;
    });
    row.dataset.category = category;
    row.dataset.amount = amount;
    return row;
}

// ============== STATE READERS ==============

function getIncomes() {
    return Array.from(document.querySelectorAll(".income-row")).map(r => ({
        source: r.querySelector(".income-source").value.trim() || "Gelir",
        amount: parseFloat(r.querySelector(".income-amount").value) || 0
    })).filter(i => i.amount > 0);
}

function getExpenses() {
    return Array.from(document.querySelectorAll(".expense-amount")).map(input => ({
        category: input.dataset.category || "Diğer",
        amount: parseFloat(input.value) || 0
    })).filter(e => e.amount > 0);
}

function getCutTargets() {
    return Array.from(document.querySelectorAll(".cut-row")).filter(r => {
        return r.querySelector(".cut-enable").checked;
    }).map(r => ({
        category: r.dataset.category,
        percent: parseFloat(r.querySelector(".pct-input").value) || 0
    })).filter(c => c.percent > 0);
}

function updateInvestmentPreview() {
    const total = getIncomes().reduce((s, i) => s + i.amount, 0);
    const slider = document.getElementById("investmentPct");
    const pct = parseFloat(slider.value) || 0;
    slider.style.setProperty("--val", (pct / 80 * 100) + "%");
    document.getElementById("investmentPctValue").textContent = "%" + pct;
    const preview = document.getElementById("investmentPreview");
    const monthsEl = document.getElementById("investmentMonths");
    const targetEl = document.getElementById("priceTarget");
    const months = Math.max(1, Math.min(600, parseInt(monthsEl && monthsEl.value) || 12));
    const monthlyInvest = total * pct / 100;
    if (total > 0) {
        preview.textContent = `Toplam gelir ${fmt(total)} → Aylık yatırım: ${fmt(monthlyInvest)} × ${months} ay = ${fmt(monthlyInvest * months)} (getirisiz)`;
    } else {
        preview.textContent = "Toplam gelir girilince hesaplanacak.";
    }

    const targetPreview = document.getElementById("targetPreview");
    if (targetPreview) {
        const target = parseFloat(targetEl && targetEl.value) || 0;
        if (target > 0 && monthlyInvest > 0) {
            const monthlyReturn = 0.20 / 12;
            const ratio = (target * monthlyReturn) / monthlyInvest + 1;
            const monthsToTarget = Math.ceil(Math.log(ratio) / Math.log(1 + monthlyReturn));
            targetPreview.textContent = `Hedef ${fmt(target)} → %20 yıllık getiri varsayımıyla yaklaşık ${monthsToTarget} ayda ulaşılır.`;
        } else if (target > 0) {
            targetPreview.textContent = `Hedef ${fmt(target)} — hesaplama için önce gelir ve yatırım yüzdesi girin.`;
        } else {
            targetPreview.textContent = "";
        }
    }
}

function rebuildCutOptions() {
    const expenses = getExpenses();
    const cutList = document.getElementById("cutList");
    const prevState = {};
    cutList.querySelectorAll(".cut-row").forEach(r => {
        prevState[r.dataset.category] = {
            enabled: r.querySelector(".cut-enable").checked,
            pct: r.querySelector(".pct-input").value
        };
    });
    cutList.innerHTML = "";
    if (expenses.length === 0) {
        cutList.innerHTML = '<div class="muted small">Önce gider ekleyin, ardından kısıntı yapmak istediğiniz kategorileri seçebilirsiniz.</div>';
        return;
    }
    expenses.forEach(e => {
        const row = buildCutRow(e.category, e.amount);
        if (prevState[e.category]) {
            const cb = row.querySelector(".cut-enable");
            cb.checked = prevState[e.category].enabled;
            const pct = row.querySelector(".pct-input");
            pct.value = prevState[e.category].pct;
            pct.disabled = !cb.checked;
        }
        cutList.appendChild(row);
    });
}

function initIncomes(count = 1) {
    const list = document.getElementById("incomeList");
    list.innerHTML = "";
    for (let i = 0; i < count; i++) {
        list.appendChild(buildIncomeRow());
    }
}

function initExpenses() {
    const list = document.getElementById("expenseList");
    list.innerHTML = "";
    DEFAULT_EXPENSES.forEach(cat => list.appendChild(buildExpenseRow(cat)));
}

// ============== RUN & RENDER ==============

function runAnalysis() {
    const payload = {
        incomes: getIncomes(),
        expenses: getExpenses(),
        investment_pct: parseFloat(document.getElementById("investmentPct").value) || 0,
        investment_months: parseInt(document.getElementById("investmentMonths").value) || 12,
        price_target: parseFloat(document.getElementById("priceTarget").value) || 0,
        cut_targets: getCutTargets()
    };

    if (payload.incomes.length === 0) {
        alert("Lütfen en az bir gelir kalemi girin.");
        return;
    }

    const data = analyze(payload);
    renderResults(data);
    document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });

    // Topluluk verilerine kullanıcının kısıntılarını ekle, sonra istatistikleri yenile.
    submitCutsToCommunity(payload.cut_targets).then(loadCommunityStats);
}

// ============== COMMUNITY STATS ==============

async function loadCommunityStats() {
    try {
        const res = await fetch("/api/cuts/stats", { cache: "no-store" });
        if (!res.ok) throw new Error("stats fetch failed");
        renderCommunityStats(await res.json());
    } catch (e) {
        const c = document.getElementById("communityStats");
        if (c) c.innerHTML = '<div class="muted small">Topluluk verileri şu anda alınamadı.</div>';
    }
}

async function submitCutsToCommunity(cuts) {
    if (!Array.isArray(cuts) || cuts.length === 0) return;
    try {
        await fetch("/api/cuts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cuts })
        });
    } catch (e) {
        // sessiz geç
    }
}

function renderCommunityStats(stats) {
    const container = document.getElementById("communityStats");
    if (!container) return;
    if (!stats || !stats.total_submissions) {
        container.innerHTML = '<div class="muted small">Henüz topluluk verisi yok. İlk analizi siz yapın!</div>';
        destroyChart("community");
        return;
    }
    const byPct = [...stats.categories].sort((a, b) => b.avg_percent - a.avg_percent);
    const top = byPct.slice(0, 10);
    const most = byPct[0];
    const least = byPct[byPct.length - 1];
    const chartH = Math.max(240, top.length * 32);

    container.innerHTML = `
        <div class="muted small" style="margin-bottom:10px;">
            Toplam <strong>${stats.total_submissions}</strong> kullanıcının kısıntı tercihi.
        </div>
        <div style="position:relative; height:${chartH}px;">
            <canvas id="communityChart"></canvas>
        </div>
        <div class="muted small" style="margin-top:10px; line-height:1.6;">
            <strong>En çok kısılan kategori:</strong> ${most.category} — ortalama %${most.avg_percent.toFixed(1)} (kullanıcıların %${(most.share*100).toFixed(0)}'i seçti).<br>
            <strong>En az kısılan kategori:</strong> ${least.category} — ortalama %${least.avg_percent.toFixed(1)} (kullanıcıların %${(least.share*100).toFixed(0)}'i seçti).
        </div>
    `;

    destroyChart("community");
    charts.community = new Chart(document.getElementById("communityChart"), {
        type: "bar",
        data: {
            labels: top.map(c => c.category),
            datasets: [{
                label: "Ortalama Kısıntı (%)",
                data: top.map(c => c.avg_percent),
                backgroundColor: top.map((_, i) => `hsl(${190 + i * 18}, 65%, 55%)`),
                borderRadius: 6
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            indexAxis: "y",
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const row = top[ctx.dataIndex];
                            return `Ortalama %${row.avg_percent.toFixed(1)} kısıntı — ${row.count} kullanıcı (%${(row.share*100).toFixed(0)})`;
                        }
                    }
                }
            },
            scales: {
                x: { beginAtZero: true, max: 100, ticks: { callback: (v) => "%" + v } }
            }
        }
    });
}

function renderResults(data) {
    document.getElementById("results").classList.remove("hidden");
    const t = data.totals;
    document.getElementById("statIncome").textContent = fmt(t.income);
    document.getElementById("statExpense").textContent = fmt(t.expense);
    document.getElementById("statInvest").textContent = fmt(t.investment);
    document.getElementById("statNet").textContent = fmt(t.net);
    document.getElementById("statRate").textContent = fmtPct(t.savings_rate);
    document.getElementById("statCut").textContent = fmt(t.saved_total) + "/ay";

    const projTitle = document.getElementById("projectionTitle");
    if (projTitle) projTitle.textContent = `${t.investment_months} Aylık Kümülatif Projeksiyon`;

    const insightsEl = document.getElementById("insights");
    insightsEl.innerHTML = "";
    (data.insights || []).forEach(text => {
        const item = document.createElement("div");
        item.className = "insight-item";
        item.textContent = text;
        insightsEl.appendChild(item);
    });
    if ((data.insights || []).length === 0) {
        insightsEl.innerHTML = '<div class="insight-item">Görüş eklenecek bir bulgu yok.</div>';
    }
    drawCharts(data);
}

// ============== CHARTS ==============

function destroyChart(key) {
    if (charts[key]) { charts[key].destroy(); delete charts[key]; }
}

function drawCharts(data) {
    const t = data.totals;
    const palette = ["#10b981", "#ef4444", "#8b5cf6", "#0ea5e9", "#f59e0b", "#14b8a6", "#ec4899", "#f97316", "#84cc16", "#6366f1", "#06b6d4", "#a855f7"];

    // 1. Donut: Bütçe Dağılımı
    destroyChart("budget");
    const safeNet = Math.max(t.net, 0);
    const overspend = Math.max(-t.net, 0);
    const dLabels = ["Gider", "Yatırım", "Net Tasarruf"];
    const dVals = [t.expense, t.investment, safeNet];
    const dCols = ["#ef4444", "#8b5cf6", "#10b981"];
    if (overspend > 0) { dLabels.push("Açık (Bütçe Aşımı)"); dVals.push(overspend); dCols.push("#991b1b"); }
    charts.budget = new Chart(document.getElementById("budgetDonut"), {
        type: "doughnut",
        data: { labels: dLabels, datasets: [{ data: dVals, backgroundColor: dCols, borderWidth: 2, borderColor: "#fff" }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom" },
                tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${fmt(ctx.parsed)} (${t.income > 0 ? (ctx.parsed/t.income*100).toFixed(1) : 0}%)` } }
            }
        }
    });

    // 2. Pie: Gider Kategorileri
    destroyChart("expense");
    charts.expense = new Chart(document.getElementById("expensePie"), {
        type: "pie",
        data: {
            labels: data.expense_breakdown.map(e => e.category),
            datasets: [{ data: data.expense_breakdown.map(e => e.amount), backgroundColor: palette, borderWidth: 2, borderColor: "#fff" }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom", labels: { boxWidth: 12 } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${fmt(ctx.parsed)}` } }
            }
        }
    });

    // 3. Bar: Mevcut vs. Tasarruf Sonrası
    destroyChart("compare");
    charts.compare = new Chart(document.getElementById("compareBar"), {
        type: "bar",
        data: {
            labels: ["Gider", "Yatırım", "Net Tasarruf"],
            datasets: [
                { label: "Mevcut Durum", data: [t.expense, t.investment, Math.max(t.net, 0)], backgroundColor: "rgba(148, 163, 184, 0.7)", borderRadius: 8 },
                { label: "Tasarruf Sonrası", data: [t.projected_expense, t.investment, Math.max(t.projected_net, 0)], backgroundColor: "rgba(14, 165, 233, 0.85)", borderRadius: 8 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` } } },
            scales: { y: { beginAtZero: true, ticks: { callback: (v) => fmt(v) } } }
        }
    });

    // 4. Line: 12 Ay Projeksiyon
    destroyChart("projection");
    const p = data.projection;
    charts.projection = new Chart(document.getElementById("projectionLine"), {
        type: "line",
        data: {
            labels: p.months.map(m => m + ". Ay"),
            datasets: [
                { label: "Yatırım (kümülatif)", data: p.investment, borderColor: "#8b5cf6", backgroundColor: "rgba(139, 92, 246, 0.1)", fill: true, tension: 0.3 },
                { label: "Tasarruf (mevcut)", data: p.savings_current, borderColor: "#94a3b8", backgroundColor: "rgba(148, 163, 184, 0.1)", fill: true, tension: 0.3, borderDash: [6, 6] },
                { label: "Tasarruf (kısıntılarla)", data: p.savings_improved, borderColor: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.15)", fill: true, tension: 0.3 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}` } } },
            scales: { y: { beginAtZero: true, ticks: { callback: (v) => fmt(v) } } }
        }
    });

    // 5. Bar: Gelir Kaynakları
    destroyChart("income");
    charts.income = new Chart(document.getElementById("incomeBar"), {
        type: "bar",
        data: {
            labels: data.income_breakdown.map(i => i.source),
            datasets: [{ label: "Aylık Gelir", data: data.income_breakdown.map(i => i.amount), backgroundColor: "#10b981", borderRadius: 8 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            indexAxis: "y",
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => fmt(ctx.parsed.x) } } },
            scales: { x: { beginAtZero: true, ticks: { callback: (v) => fmt(v) } } }
        }
    });
}

// ============== INIT ==============

document.addEventListener("DOMContentLoaded", () => {
    initIncomes(1);
    initExpenses();
    rebuildCutOptions();
    updateInvestmentPreview();
    loadCommunityStats();

    document.getElementById("applyIncomeCount").addEventListener("click", () => {
        const n = Math.max(1, Math.min(20, parseInt(document.getElementById("incomeCount").value) || 1));
        initIncomes(n);
        updateInvestmentPreview();
    });
    document.getElementById("addIncome").addEventListener("click", () => {
        document.getElementById("incomeList").appendChild(buildIncomeRow());
    });
    document.getElementById("addExpense").addEventListener("click", () => {
        document.getElementById("expenseList").appendChild(buildCustomExpenseRow());
    });
    document.getElementById("investmentPct").addEventListener("input", updateInvestmentPreview);
    document.getElementById("investmentMonths").addEventListener("input", updateInvestmentPreview);
    document.getElementById("priceTarget").addEventListener("input", updateInvestmentPreview);
    document.getElementById("analyzeBtn").addEventListener("click", runAnalysis);
    document.getElementById("resetBtn").addEventListener("click", () => {
        if (!confirm("Tüm girdiler silinsin mi?")) return;
        document.getElementById("incomeCount").value = 1;
        initIncomes(1);
        initExpenses();
        document.getElementById("investmentPct").value = 20;
        document.getElementById("investmentMonths").value = 12;
        document.getElementById("priceTarget").value = "";
        updateInvestmentPreview();
        rebuildCutOptions();
        document.getElementById("results").classList.add("hidden");
    });
});
