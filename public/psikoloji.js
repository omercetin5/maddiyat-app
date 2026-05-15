// ====================================================================
//  PSIKOLOJI - Mock/Demo davranışı
//
//  Bu dosya hiçbir backend'e dokunmuyor. Tüm "veri" sahte:
//   - Sektör istatistikleri SECTOR_STATS'tan geliyor (statik)
//   - Premium flag localStorage'da tutuluyor ("maddiyat_premium")
//   - Geçmiş raporlar localStorage'da tutuluyor ("maddiyat_reports")
//   - AI raporu template tabanlı, lokal üretiliyor (Claude API yok)
//
//  İlerleyen sürümde değişecek yerler:
//   - SECTOR_STATS → backend agregasyon endpoint'ine
//   - Premium flag → server-side subscription status
//   - generateAIReport() → gerçek Claude API çağrısına
// ====================================================================

// ============== MESLEKLER ==============

const PROFESSIONS = [
    { id: "tech",          name: "Yazılım / Teknoloji" },
    { id: "health",        name: "Sağlık (Doktor, Hemşire, Sağlık Personeli)" },
    { id: "education",     name: "Eğitim / Akademi" },
    { id: "finance",       name: "Finans / Bankacılık" },
    { id: "law",           name: "Hukuk" },
    { id: "engineering",   name: "Mühendislik (İnşaat, Makine, Elektrik)" },
    { id: "sales",         name: "Satış / Pazarlama" },
    { id: "service",       name: "Müşteri Hizmetleri / Çağrı Merkezi" },
    { id: "public",        name: "Kamu / Memuriyet" },
    { id: "creative",      name: "Sanat / Tasarım / Medya" },
    { id: "freelance",     name: "Serbest Meslek" },
    { id: "trade",         name: "Esnaf / Küçük İşletme" },
    { id: "logistics",     name: "Lojistik / Ulaşım / Kurye" },
    { id: "manufacturing", name: "Üretim / İmalat" },
    { id: "hospitality",   name: "Turizm / Otel / Restoran" },
    { id: "other",         name: "Diğer" }
];

// ============== SAHTE SEKTÖR İSTATİSTİKLERİ ==============

const SECTOR_STATS = {
    tech:          { name: "Yazılım",            avgStress: 7.2, avgComfortSpend: 2400, burnoutRate: 0.58, savingsImpact: 23, sleepDisrupted: 0.64 },
    health:        { name: "Sağlık",             avgStress: 8.1, avgComfortSpend: 1800, burnoutRate: 0.71, savingsImpact: 28, sleepDisrupted: 0.78 },
    education:     { name: "Eğitim",             avgStress: 6.4, avgComfortSpend: 1200, burnoutRate: 0.43, savingsImpact: 15, sleepDisrupted: 0.41 },
    finance:       { name: "Finans",             avgStress: 7.8, avgComfortSpend: 3100, burnoutRate: 0.62, savingsImpact: 26, sleepDisrupted: 0.68 },
    law:           { name: "Hukuk",              avgStress: 7.5, avgComfortSpend: 2800, burnoutRate: 0.55, savingsImpact: 21, sleepDisrupted: 0.59 },
    engineering:   { name: "Mühendislik",        avgStress: 6.7, avgComfortSpend: 1900, burnoutRate: 0.41, savingsImpact: 18, sleepDisrupted: 0.44 },
    sales:         { name: "Satış/Pazarlama",    avgStress: 7.6, avgComfortSpend: 2600, burnoutRate: 0.59, savingsImpact: 24, sleepDisrupted: 0.61 },
    service:       { name: "Müşteri Hizmetleri", avgStress: 7.4, avgComfortSpend: 1500, burnoutRate: 0.64, savingsImpact: 19, sleepDisrupted: 0.57 },
    public:        { name: "Kamu",               avgStress: 5.8, avgComfortSpend:  900, burnoutRate: 0.35, savingsImpact: 11, sleepDisrupted: 0.32 },
    creative:      { name: "Sanat/Tasarım",      avgStress: 6.9, avgComfortSpend: 1700, burnoutRate: 0.47, savingsImpact: 20, sleepDisrupted: 0.49 },
    freelance:     { name: "Serbest Meslek",     avgStress: 7.1, avgComfortSpend: 2000, burnoutRate: 0.52, savingsImpact: 22, sleepDisrupted: 0.55 },
    trade:         { name: "Esnaf",              avgStress: 7.3, avgComfortSpend: 1400, burnoutRate: 0.49, savingsImpact: 17, sleepDisrupted: 0.51 },
    logistics:     { name: "Lojistik",           avgStress: 7.0, avgComfortSpend: 1300, burnoutRate: 0.51, savingsImpact: 16, sleepDisrupted: 0.53 },
    manufacturing: { name: "Üretim",             avgStress: 6.5, avgComfortSpend: 1100, burnoutRate: 0.44, savingsImpact: 14, sleepDisrupted: 0.46 },
    hospitality:   { name: "Turizm/Otel",        avgStress: 7.2, avgComfortSpend: 1300, burnoutRate: 0.55, savingsImpact: 17, sleepDisrupted: 0.62 },
    other:         { name: "Genel",              avgStress: 6.8, avgComfortSpend: 1700, burnoutRate: 0.50, savingsImpact: 18, sleepDisrupted: 0.50 }
};

// ============== KAYDA DEĞER BİLGİLER (sektörel) ==============

const NOTABLE_INSIGHTS = {
    tech: [
        { title: "İmposter Sendromu", body: "Yazılım sektöründe çalışanların %72'si en az bir kez ciddi imposter sendromu yaşadığını rapor ediyor. Bu hissin tetiklediği en yaygın finansal davranış: gereksiz eğitim/sertifika harcaması (ortalama yıllık 4.500₺)." },
        { title: "Sürekli Öğrenme Yorgunluğu", body: "Sektör çalışanları yıllık ortalama 8-12 yeni teknolojiyi takip etmek zorunda. Bu bilişsel yük, finansal karar verme kalitesini ortalama %18 düşürüyor — özellikle yatırım kararlarında." },
        { title: "Erken Tükenmişlik", body: "5-7 yıllık deneyimli yazılımcıların %43'ü tükenmişlikle karşılaşıyor. Bu dönemde kariyer değişikliği harcamaları (kurs, danışmanlık, hatta yurtdışı taşınma planları) ortalama 35.000₺'yi buluyor." }
    ],
    health: [
        { title: "Vicdan Yorgunluğu (Compassion Fatigue)", body: "Sağlık çalışanlarının %78'i hasta empatisinin yarattığı duygusal tükenmeyi yaşıyor. Bu, gece nöbetlerinden sonra yapılan 'kendini ödüllendirme' alışverişlerinin temel motivasyonu — aylık 1.800-2.500₺ etkisi var." },
        { title: "Vardiya Sistemi ve Mali Disiplin", body: "Vardiyalı çalışanlar normal saatte çalışanlara göre %34 daha fazla anlık karar veriyor. Sebep: biyolojik ritim bozukluğu prefrontal korteks aktivitesini düşürüyor." },
        { title: "İkincil Travma", body: "Acil servis ve yoğun bakım personelinin %52'sinde ikincil travma belirtileri var. Bu, sağlığa ek harcama (terapi, ilaç, takviye) olarak yıllık ortalama 6.000-9.000₺'ye karşılık geliyor." }
    ],
    education: [
        { title: "Görünmez Mesai", body: "Öğretmenlerin günde ortalama 2.8 saat mesai dışı çalıştığı tahmin ediliyor (sınav hazırlama, veli iletişimi). Bu 'kazanılmamış emek' duygusu, telafi amaçlı küçük lüks harcamalara yol açıyor (aylık ortalama 800-1.200₺)." },
        { title: "Düşük Maaş – Yüksek Beklenti Çatışması", body: "Eğitim sektöründe maaş-saygı dengesizliği en yüksek seviyede. Bu, ek gelir arayışını (özel ders, kitap yazımı) tetikliyor — ortalama haftalık 8-12 ek saat." },
        { title: "Akademik Tükenmişlik", body: "Akademisyenlerin %47'sinde yayın baskısı kaynaklı tükenmişlik var. Bu, kongre/konferans harcamalarında 'kaçış' davranışına dönüşebiliyor." }
    ],
    finance: [
        { title: "Yüksek Stres – Yüksek Kompansasyon", body: "Finans sektörü en yüksek 'rahatlama harcaması' oranına sahip (aylık ortalama 3.100₺). Sebep: stresin telafisi için yüksek gelir 'haklı' görülüyor — ama bu uzun vadeli birikimi %26 oranında baltalıyor." },
        { title: "Risk Tolerans Yanılgısı", body: "Finansçıların kendi paralarını yönetirken iş hayatından %40 daha agresif risk aldığı görülüyor. Sebep: 'biliyorum, kontrol edebilirim' aşırı güveni — gerçekte performans ortalama yatırımcıdan farklı değil." },
        { title: "Etik Yorgunluk", body: "Sektör çalışanlarının %38'i etik çelişki yaşadığını rapor ediyor. Bu, bağış/hayırseverlik harcamalarında kendini gösteriyor (aylık ortalama 500-800₺) — bir tür telafi mekanizması." }
    ],
    law: [
        { title: "Adversariyal Yorgunluk", body: "Avukatların %61'i mesleğin çatışma odaklı doğasından kaynaklı 'adversariyal yorgunluk' yaşıyor. Bu, hafta sonu lüks harcamalarında belirgin artışa neden oluyor (ortalama %42 daha fazla)." },
        { title: "Tarife – Saat Tuzağı", body: "Saatlik ücret modeli, avukatların boş zamanı bile 'kazanç kaybı' olarak görmesine yol açıyor. Bu paradoks, dinlenme harcamalarını artırırken dinlenememe sorununu büyütüyor." },
        { title: "Müvekkil Empati Yükü", body: "Aile/ceza hukuku alanlarında müvekkil sorunları taşıma yükü, hukukçuların %48'inde uyku bozukluğuna yol açıyor — aylık ortalama 600-900₺ takviye/ilaç harcaması." }
    ],
    engineering: [
        { title: "Sorumluluk Yükü", body: "İnşaat ve makine mühendislerinin %53'ü, projelerinde 'can güvenliği' boyutunun uykusunu kaçırdığını rapor ediyor. Bu yük, görece istikrarlı bir sektör olmasına rağmen yüksek kompansasyon harcaması yaratıyor." },
        { title: "Şantiye/Saha Yorgunluğu", body: "Saha mühendislerinde yıllık ortalama 23 fazla mesai günü var. Bu zaman 'telafisi' olarak yapılan harcamalar (kısa tatil, lüks alışveriş) yıllık 8.000-12.000₺ etkide." },
        { title: "Sertifika Yarışı", body: "Sektörde yıllık ortalama 2.5 sertifika programı takip ediliyor. Bu eğitim harcamaları gerekli görülse de getirisinin %38'i belirsiz." }
    ],
    sales: [
        { title: "Hedef Stresi", body: "Satışçıların %67'si ay sonu hedef stresinin 'kutlama harcamalarını' fazlaca tetiklediğini söylüyor. Hedef tutturulduğunda yapılan ödül harcamaları, ayın %20-30'unu yiyebiliyor." },
        { title: "Komisyon Belirsizliği", body: "Değişken gelir, finansal planlama zorluğu yaratıyor. Sektör çalışanlarının %58'i sabit bir bütçe tutamadığını söylüyor." },
        { title: "Sosyal Performans Yükü", body: "Müşteri ağırlama (yemek, hediye, eğlence) için yapılan kişisel harcamalar yıllık ortalama 6.500₺'yi buluyor — bunun ne kadarının geri dönüşü olduğu belirsiz." }
    ],
    service: [
        { title: "Duygusal Emek", body: "Müşteri hizmetleri personeli sürekli pozitif duygu sergilemek zorunda. Bu 'duygusal emek' yorgunluğu, %72'sinde iş sonrası 'kendini iyi hissettirme' alışverişlerine yol açıyor." },
        { title: "Düşük Otonomi Etkisi", body: "Senaryolu konuşma ve mola kısıtlamaları, çalışanlarda kontrol kaybı hissi yaratıyor. Bu hissi telafi etmek için yapılan 'kontrol edebilirim' alışverişleri (online sipariş kararları) ortalama %35 daha fazla." },
        { title: "Görünmez Ofis Yorgunluğu", body: "Sektörde tükenmişlik fark edilebilirliği düşük; çalışanların %41'i 'tatil etti' düşüncesiyle iş değiştiriyor ve aynı sorunlarla karşılaşıyor." }
    ],
    public: [
        { title: "İş Güvencesi – Tuzağı", body: "Kamu çalışanlarının stres seviyesi düşük (5.8/10) ama bu güvence, finansal motivasyonu da düşürebiliyor. Sektörün tasarruf oranı ortalamanın %12 üzerinde — ancak yatırım disiplini düşük." },
        { title: "Bürokratik Yorgunluk", body: "Sürekli prosedür baskısı, çalışanların %41'inde 'anlamsız iş' duygusu yaratıyor. Bu duyguyu hobi/yan iş ile telafi girişimleri yaygın — ortalama yıllık 3.500₺ ek harcama." },
        { title: "Emeklilik Yanılgısı", body: "Kamu çalışanlarının %63'ü 'emeklilik beni kurtarır' düşüncesiyle aktif tasarruf disiplinini geciktiriyor. Ortalama emeklilik geliri kayıpları net 8-12 yıllık bireysel emeklilik birikiminin yarısına denk." }
    ],
    creative: [
        { title: "Yaratıcılık Tükenmesi", body: "Sanat/tasarım profesyonellerinin %58'i kreatif blok dönemlerinde gelirinin %30+ düştüğünü söylüyor. Bu finansal istikrarsızlık, sektörün en kronik sorunu." },
        { title: "'Görünür Olma' Maliyeti", body: "Sektörde portfolyo, donanım, etkinlik harcamaları yıllık ortalama 12.000-18.000₺'yi buluyor — bunu 'yatırım' olarak görüyorlar ama getirisi belirsiz." },
        { title: "Tutku – Gelir Çatışması", body: "Sektörün %64'ü 'sevdiği işi yaptığı için yüksek maaş beklememeli' baskısını içselleştirmiş. Bu psikolojik baskı, daha düşük müzakere ve daha az tasarrufla sonuçlanıyor." }
    ],
    freelance: [
        { title: "Gelir Belirsizliği Anksiyetesi", body: "Serbest çalışanların %71'i gelir belirsizliğinden kaynaklı kronik anksiyete yaşıyor. Bu anksiyetenin telafi mekanizması: 'ödül günleri' — ay iyi geçince yapılan yüksek harcamalar." },
        { title: "Sosyal İzolasyon", body: "Evden çalışan freelancer'ların %48'inde sosyal eksiklik var. Bu, dışarıda yemek/kahve harcamalarını ortalama %40 artırıyor — 'sosyalleşme bahanesi'." },
        { title: "Vergi Şoku", body: "Sektör çalışanlarının %62'si yıllık vergi yükümlülüğünü hesaba katmadan harcama yapıyor. Bu, Mart-Nisan aylarında ciddi nakit akış krizine yol açıyor." }
    ],
    trade: [
        { title: "Aile Yükü", body: "Esnaf çalışanlarının %57'si 'aileyi geçindirme' yükünü ana stres kaynağı olarak gösteriyor. Bu yük, kişisel harcamaları minimize ederken işyeri masraflarını şişirebiliyor." },
        { title: "Müşteri Bağımlılığı", body: "Küçük işletme sahiplerinin %63'ü zor müşterilerle ilişki sürdürmek zorunda kaldığını söylüyor. Bu durum, iş dışında öfke patlaması ve aşırı harcama davranışına yol açabiliyor." },
        { title: "İş–Kişi Karışıklığı", body: "Sektörde iş varlığı ile kişisel varlık ayrımı %71 oranında bulanık. Bu, hem işletmenin hem kişisel finansın gerçek durumunu görmeyi zorlaştırıyor." }
    ],
    logistics: [
        { title: "Uzun Yol Yalnızlığı", body: "Şoför ve kurye çalışanların %59'unda yalnızlık temelli depresif belirtiler var. Yol üstü 'telafi alışverişleri' aylık ortalama 1.200-1.500₺ tutuyor." },
        { title: "Fiziksel Yorgunluk Telafisi", body: "Sektörde fiziksel yorgunluk, fast food ve enerji içeceği gibi sağlıksız ama 'hızlı' harcamaları tetikliyor — sağlık masrafları olarak geri dönüyor." },
        { title: "Mesai Saat Tuzağı", body: "Saat başı ücretlendirme, çalışanların 'daha çok saat = daha çok para' yanılgısına düşmesine yol açıyor. Tükenmişlik ise gelirin sağlık masraflarına dönüşmesini hızlandırıyor." }
    ],
    manufacturing: [
        { title: "Monotonluk Etkisi", body: "Fabrika işçilerinin %52'si işin tekrar eden doğasından kaynaklı 'bilişsel uyuşma' yaşıyor. Bu, mesai sonrası uyarı arama davranışına (alkol, oyun) yol açabiliyor — sağlığa ve cüzdana çift maliyet." },
        { title: "Vardiya – Aile Çatışması", body: "Vardiyalı çalışanların %44'ünde aile ilişkilerinde gerilim var. Bu, 'aileyi telafi etme' hediye harcamalarına yol açıyor." },
        { title: "Sendika ve Bireysel Müzakere", body: "Toplu sözleşme dışında bireysel müzakere imkanı dar. Bu güçsüzlük hissi, kontrol illüzyonu için yapılan harcamalara yansıyor." }
    ],
    hospitality: [
        { title: "Sezon Stresi", body: "Turizm çalışanlarının %66'sı yıllık 4-6 aylık yoğun sezonda fiziksel/psikolojik tükenmişlik yaşıyor. Sezon sonu 'kaçış tatili' harcamaları yıllık birikimin %25'ini götürebiliyor." },
        { title: "Müşteri Memnuniyeti Baskısı", body: "Online değerlendirmelerin gücü, çalışanlarda sürekli yargılanma hissi yaratıyor. Bu, kişisel imaj harcamalarını (giyim, bakım) artırıyor." },
        { title: "Bahşiş Belirsizliği", body: "Bahşiş bazlı gelir, finansal planlamayı imkansıza yakın hale getiriyor. Sektörün %58'i 'gelirim ne kadar olacak bilmiyorum' diyor." }
    ],
    other: [
        { title: "Stres – Tasarruf İlişkisi", body: "Tüm sektörlerde, yüksek stres yaşayan çalışanların tasarruf disiplini ortalama %18 daha düşük. Stresin para üzerindeki etkisi sektörden bağımsız bir gerçeklik." },
        { title: "Telafi Harcamaları", body: "'Kötü gün sonrası alışveriş' davranışı genel popülasyonda %62 oranında görülüyor. Bu harcamalar genelde planlanmamış ve aylık bütçenin %8-15'ini oluşturuyor." },
        { title: "Pişmanlık Kararları", body: "Kronik stres altında verilen finansal kararların %71'i 6 ay sonra 'pişman olunan' kararlar olarak değerlendiriliyor." }
    ]
};

// ============== STATE ==============

const STATE = {
    profession: "tech",
    yearsInRole: 3,
    freeAnswers: null,
    premiumAnswers: null
};

const fmt = (n) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.round(n || 0));

// ============== PREMIUM (mock) ==============

function isPremium() {
    return localStorage.getItem("maddiyat_premium") === "true";
}

function setPremium(value) {
    if (value) {
        localStorage.setItem("maddiyat_premium", "true");
        localStorage.setItem("maddiyat_premium_started", String(Date.now()));
    } else {
        localStorage.removeItem("maddiyat_premium");
        localStorage.removeItem("maddiyat_premium_started");
    }
    refreshPremiumUI();
}

function refreshPremiumUI() {
    const banner = document.getElementById("premiumBanner");
    if (isPremium()) {
        banner.classList.remove("hidden");
    } else {
        banner.classList.add("hidden");
    }
}

// ============== INIT ==============

function init() {
    // Meslek dropdown'unu doldur
    const sel = document.getElementById("profession");
    PROFESSIONS.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name;
        sel.appendChild(opt);
    });
    sel.value = STATE.profession;
    sel.addEventListener("change", () => { STATE.profession = sel.value; });

    document.getElementById("yearsInRole").addEventListener("input", (e) => {
        STATE.yearsInRole = Math.max(0, parseInt(e.target.value) || 0);
    });

    // Slider'lar
    bindSlider("q_stress", "q_stress_val");
    bindSlider("q_future", "q_future_val");

    // Form butonları
    document.getElementById("submitFree").addEventListener("click", onSubmitFree);
    document.getElementById("upgradePremium").addEventListener("click", openPaymentModal);
    document.getElementById("cancelPayment").addEventListener("click", closePaymentModal);
    document.getElementById("confirmPayment").addEventListener("click", confirmPayment);
    document.getElementById("generateReport").addEventListener("click", onGenerateReport);
    document.getElementById("cancelPremium").addEventListener("click", () => {
        if (confirm("Premium demo'sunu kapatmak istediğine emin misin? Geçmiş raporların silinmeyecek.")) {
            setPremium(false);
            document.getElementById("premiumSection").classList.add("hidden");
        }
    });

    // Eğer zaten premium ise UI'yi aç
    refreshPremiumUI();
    if (isPremium()) {
        renderPastReports();
    }
}

function bindSlider(id, outId) {
    const input = document.getElementById(id);
    const out = document.getElementById(outId);
    const update = () => {
        out.textContent = input.value;
        input.style.setProperty("--val", ((parseInt(input.value) - parseInt(input.min)) / (parseInt(input.max) - parseInt(input.min)) * 100) + "%");
    };
    input.addEventListener("input", update);
    update();
}

// ============== FREE SURVEY ==============

function readFreeAnswers() {
    const radio = (name) => {
        const r = document.querySelector(`input[name="${name}"]:checked`);
        return r ? parseInt(r.value) : null;
    };
    return {
        stress: parseInt(document.getElementById("q_stress").value),
        sleep: radio("q_sleep"),
        compSpend: radio("q_comp_spend"),
        decisions: radio("q_decisions"),
        continueWork: radio("q_continue")
    };
}

function onSubmitFree() {
    const answers = readFreeAnswers();
    const missing = ["sleep", "compSpend", "decisions", "continueWork"].filter((k) => answers[k] === null);
    if (missing.length > 0) {
        alert("Lütfen tüm soruları yanıtla — eksik sorular var.");
        return;
    }
    STATE.freeAnswers = answers;
    renderFreeResult();
    document.getElementById("freeResult").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderFreeResult() {
    const sector = SECTOR_STATS[STATE.profession];
    const a = STATE.freeAnswers;
    const stress = a.stress;
    const stressDelta = stress - sector.avgStress;

    const body = document.getElementById("freeResultBody");
    body.innerHTML = `
        <div class="stats-grid">
            <div class="stat stat-rate">
                <span class="stat-label">Stres Seviyen</span>
                <span class="stat-value">${stress}/10</span>
            </div>
            <div class="stat">
                <span class="stat-label">${sector.name} Ort.</span>
                <span class="stat-value">${sector.avgStress.toFixed(1)}/10</span>
            </div>
            <div class="stat stat-expense">
                <span class="stat-label">Sektör Tükenmişlik</span>
                <span class="stat-value">%${Math.round(sector.burnoutRate * 100)}</span>
            </div>
            <div class="stat stat-cut">
                <span class="stat-label">Tahmini Maddi Etki</span>
                <span class="stat-value">~%${sector.savingsImpact}</span>
            </div>
        </div>

        <div class="insights" style="margin-top: 1rem;">
            <div class="insight-item">${sector.name} sektöründe çalışanların ortalama stres seviyesi <strong>${sector.avgStress.toFixed(1)}/10</strong>. Sen <strong>${stress}/10</strong> ile bu ortalamanın <strong>${stressDelta > 0 ? `${stressDelta.toFixed(1)} puan üzerindesin` : stressDelta < 0 ? `${Math.abs(stressDelta).toFixed(1)} puan altındasın` : "tam üzerindesin"}</strong>.</div>
            <div class="insight-item">Bu seviyede stres yaşayan kullanıcılar, ortalama olarak aylık tasarruflarının <strong>%${sector.savingsImpact}'ini</strong> "rahatlama harcamalarına" kaybediyor.</div>
            ${a.sleep >= 2 ? `<div class="insight-item">Uyku düzeni etkilenen kullanıcıların <strong>%${Math.round(sector.sleepDisrupted * 100)}'i</strong> bu durumu en az 3 ay sürdürmüş.</div>` : ""}
            ${a.compSpend >= 2 ? `<div class="insight-item">Telafi harcaması yapanların aylık ortalama bütçe kaybı <strong>~${fmt(sector.avgComfortSpend)} ₺</strong> (${sector.name} sektörü için).</div>` : ""}
            ${a.continueWork === 0 ? `<div class="insight-item">Sektörde "devam etmek istemiyorum" diyen kullanıcılar 2 yıl içinde %${Math.round((1 - sector.burnoutRate) * 60)} oranında konum değişikliği yapıyor.</div>` : ""}
            <div class="insight-item">Detaylı analiz için aşağıdaki premium bölümüne göz at — kişisel AI raporu bu yanıtlardan çok daha fazlasını söyleyebilir.</div>
        </div>
    `;
    document.getElementById("freeResult").classList.remove("hidden");
}

// ============== PAYMENT MODAL ==============

function openPaymentModal() {
    document.getElementById("paymentModal").classList.remove("hidden");
}
function closePaymentModal() {
    document.getElementById("paymentModal").classList.add("hidden");
}
function confirmPayment() {
    setPremium(true);
    closePaymentModal();
    document.getElementById("premiumSection").classList.remove("hidden");
    document.getElementById("upsellBlock").innerHTML = '<div class="insight-item" style="background: #ecfdf5; padding: 1rem; border-radius: 10px;">✅ Premium aktif. Detaylı anket aşağıda açıldı.</div>';
    renderNotableInsights();
    renderPastReports();
    setTimeout(() => {
        document.getElementById("detailedSurveyCard").scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
}

// ============== PREMIUM SURVEY ==============

function readPremiumAnswers() {
    const checks = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((c) => c.value);
    return {
        burnout: checks("burnout"),
        pressure: checks("pressure"),
        comfort: checks("comfort"),
        comfortAmount: parseFloat(document.getElementById("q_comfort_amount").value) || 0,
        healthAmount: parseFloat(document.getElementById("q_health_amount").value) || 0,
        future: parseInt(document.getElementById("q_future").value),
        openDifficulty: document.getElementById("q_open_difficulty").value.trim(),
        openCost: document.getElementById("q_open_cost").value.trim()
    };
}

function onGenerateReport() {
    if (!STATE.freeAnswers) {
        alert("Önce hızlı değerlendirmeyi tamamla (yukarıdaki 2. bölüm).");
        document.getElementById("freeSurveyCard").scrollIntoView({ behavior: "smooth" });
        return;
    }
    STATE.premiumAnswers = readPremiumAnswers();
    const report = generateAIReport(STATE);
    showReport(report);
    saveReportToHistory(report);
    renderPastReports();
    setTimeout(() => {
        document.getElementById("aiReport").scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
}

function showReport(report) {
    const card = document.getElementById("aiReport");
    document.getElementById("reportDate").textContent = new Date(report.ts).toLocaleString("tr-TR");
    document.getElementById("reportSector").textContent = report.sectorName;
    document.getElementById("reportBody").innerHTML = report.paragraphs.map((p) => `<p>${p}</p>`).join("");
    card.classList.remove("hidden");
}

// ============== AI RAPOR ÜRETİCİ (template) ==============

function generateAIReport(state) {
    const sector = SECTOR_STATS[state.profession];
    const sectorName = sector.name;
    const stress = state.freeAnswers.stress;
    const sleep = state.freeAnswers.sleep;
    const continueWork = state.freeAnswers.continueWork;
    const compAmount = state.premiumAnswers.comfortAmount;
    const healthAmount = state.premiumAnswers.healthAmount;
    const futureHope = state.premiumAnswers.future;
    const burnout = state.premiumAnswers.burnout;
    const pressure = state.premiumAnswers.pressure;
    const comfort = state.premiumAnswers.comfort;
    const openDiff = state.premiumAnswers.openDifficulty;
    const openCost = state.premiumAnswers.openCost;
    const years = state.yearsInRole;

    const stressTier = stress >= 8 ? "yüksek" : stress >= 5 ? "orta" : "düşük";
    const paragraphs = [];

    // P1: Empatik açılış
    if (stressTier === "yüksek") {
        paragraphs.push(`Önce şunu söyleyeyim: anketin sonunda omuzlarında nasıl bir yük taşıdığını görüyorum. <strong>${sectorName}</strong> alanında ${years} yıldır çalışıyorsun ve şu sıralar gerçekten zor bir dönemden geçiyor olabilirsin. Bunu fark etmek, üstesinden gelmenin ilk adımı — ve buraya kadar gelmen bile bu farkındalığın var olduğunu gösteriyor.`);
    } else if (stressTier === "orta") {
        paragraphs.push(`Anket cevaplarını okurken şunu fark ettim: <strong>${sectorName}</strong> sektöründe ${years} yıllık deneyiminle, ne tam dingin ne de tam tükenmiş bir konumdaydın — bir tür "idare ediyorum ama ideal değil" bölgesi. Bu aslında çoğu profesyonelin uzun süre takıldığı yer ve konuşmaya değer.`);
    } else {
        paragraphs.push(`Anket cevapların gösteriyor ki <strong>${sectorName}</strong> alanında ${years} yıldır görece dengeli bir yerdesin — bu kıymetli bir denge ve onu koruyor olmana sevindim. Aşağıda yine de incelenmesinde fayda gördüğüm bazı dinamikleri paylaşacağım, çünkü "iyiyim" hissi bazen kör noktaları örtebiliyor.`);
    }

    // P2: Spesifik bulgular
    const observations = [];
    if (sleep >= 2) observations.push(`uyku düzenin işten ${sleep === 3 ? "ciddi şekilde" : "sıklıkla"} etkileniyor`);
    if (burnout.length >= 3) observations.push(`tükenmişliğin birden fazla yüzünü (${burnout.length} farklı belirti) aynı anda yaşıyorsun`);
    if (pressure.includes("conflict")) observations.push(`işyerinde çatışma/mobbing seviyesinde gerilim var`);
    if (futureHope <= 3) observations.push(`gelecek 5 yıla bakışın belirgin şekilde karamsar (${futureHope}/10)`);
    if (continueWork === 0) observations.push(`mesleğe devam isteğin oldukça azalmış`);

    let p2 = `Verdiğin yanıtlarda dikkatimi en çok çeken: `;
    if (observations.length > 0) {
        p2 += observations.slice(0, 3).join(", ") + ". ";
    } else {
        p2 += `belirgin alarm sinyali az ama bazı ince patternler dikkat çekici. `;
    }
    const stressDelta = stress - sector.avgStress;
    p2 += `<strong>${sectorName}</strong> sektöründe çalışanların ortalama stres seviyesi <strong>${sector.avgStress.toFixed(1)}/10</strong> — sen <strong>${stress}/10</strong> ile bu ortalamanın ${stressDelta > 1 ? `belirgin şekilde üzerindesin` : stressDelta > 0 ? `biraz üzerindesin` : stressDelta < -1 ? `belirgin şekilde altındasın` : stressDelta < 0 ? `biraz altındasın` : `tam üzerindesin`}. Yani bu yük sadece sana özgü değil; sektörel bir gerçeklik. Bunu söylüyorum çünkü "ben mi başaramıyorum" hissi çoğu zaman sektörel normların kişiselleştirilmiş halinden başka bir şey değil.`;
    paragraphs.push(p2);

    // P3: Maddi etki analizi
    let p3 = ``;
    if (compAmount > 0) {
        const compDelta = compAmount - sector.avgComfortSpend;
        p3 += `Şimdi paranın olduğu yere bakalım. Aylık ortalama <strong>${fmt(compAmount)} ₺</strong>'lik rahatlama harcaman olduğunu söylüyorsun. <strong>${sectorName}</strong> sektörü ortalaması <strong>${fmt(sector.avgComfortSpend)} ₺</strong> — sen ${compDelta > 0 ? `ortalamanın <strong>${fmt(Math.abs(compDelta))} ₺</strong> üzerindesin` : `ortalamanın <strong>${fmt(Math.abs(compDelta))} ₺</strong> altındasın`}. `;
    } else {
        p3 += `Maddi tarafa gelirsek: <strong>${sectorName}</strong> sektöründe rahatlama harcamaları aylık ortalama <strong>${fmt(sector.avgComfortSpend)} ₺</strong> — bu seninkini söylememiş olsan da sektörel bir norm ve büyük olasılıkla senin de bu civarda bir rakamın var. `;
    }

    if (comfort.length >= 3) {
        const labels = {
            shopping: "online alışveriş",
            dining: "dışarıda yemek",
            entertainment: "eğlence",
            alcohol: "alkol/sigara",
            gaming: "dijital içerik",
            impulsive: "anlık alımlar"
        };
        const list = comfort.map((c) => labels[c] || c).slice(0, 3).join(", ");
        p3 += `Özellikle <strong>${list}</strong> kategorilerindeki harcamalar dikkat çekici — bunlar "duygu telafi" mekanizmalarının en yaygın olduğu yerler. Yani genelde "şu an kötü hissediyorum, şunu satın alırsam bir an iyi hissederim" döngüsünün ürünleri. Bu döngüyü ahlaki olarak yargılamıyorum; sadece görünür yapmak istiyorum. `;
    }

    if (healthAmount > 0) {
        p3 += `Ayrıca son 6 ayda sağlığa <strong>${fmt(healthAmount)} ₺</strong> harcadığını söylüyorsun — bu, işin sana fizyolojik olarak bir fatura kestiğinin somut işareti. `;
    }

    p3 += `Sektörel veriler şunu söylüyor: <strong>${sectorName}</strong> alanında yüksek stres yaşayanlar, tasarruflarının ortalama <strong>%${sector.savingsImpact}'ini</strong> bu döngüye kaybediyor. Senin durumunda da benzer bir oranda kayıp olabilir — ve bu kayıp genelde Excel'de görünmüyor çünkü "küçük küçük" gidiyor.`;
    paragraphs.push(p3);

    // P4: Açık uçlu cevaba yanıt (eğer yazmışsa)
    if (openDiff.length > 10) {
        let p4 = `Anketin sonunda paylaştığın şu cümle önemliydi: <em>"${escapeHtml(openDiff.slice(0, 240))}${openDiff.length > 240 ? "…" : ""}"</em>. Bu, çoğu insanın kendi başına itiraf etmekte zorlandığı bir şey ve burada yazmış olman bile bir adım. `;
        if (openCost.length > 10) {
            p4 += `Bunun maddi karşılığını <em>"${escapeHtml(openCost.slice(0, 200))}${openCost.length > 200 ? "…" : ""}"</em> diye tarif etmişsin — bu farkındalığı korumak çok kıymetli; çünkü bir şeyin maliyetini fark eden insan onu yönetmeye başlayabilir.`;
        } else {
            p4 += `Bunun maddi karşılığını net olarak ifade etmemiş olsan da, bu yükün muhakkak bir bedeli var. Bunu zamanla daha somut görmek faydalı olur — ekstra harcamalar, kaçırılan fırsatlar, geciken kararlar.`;
        }
        paragraphs.push(p4);
    }

    // P5: 3 gözlem
    let p5 = `Şimdi sana doğrudan öğüt verecek değilim; çünkü senin durumunu en iyi sen biliyorsun. Ama üç gözlemi seninle bırakmak istiyorum:`;
    p5 += `<br><br><strong>Bir.</strong> Stresin senin "sırtında" değil, "davranışlarında" gizleniyor. Bu iyi bir haber — çünkü davranışlar değişebilir; sırt değiştirilemez. ${comfort.length > 0 ? `Mesela bu hafta, yukarıda işaretlediğin telafi davranışlarından sadece <strong>bir tanesini</strong> seçip o haftaki frekansını yarıya indirmeyi dene. Tek değişiklik, tek hafta — küçük başla.` : `Önümüzdeki hafta küçük bir egzersiz yapabilirsin: ne zaman "telafi" amaçlı bir karar verdiğini sadece <strong>fark et</strong>. Değiştirme, sadece not al.`}`;
    p5 += `<br><br><strong>İki.</strong> <strong>${sectorName}</strong> sektöründe değişebilen tek şey "burada kalmak ya da bırakmak" değil. Senin durumunda olanların yaklaşık %${Math.round((1 - sector.burnoutRate + 0.15) * 100)}'i 2 yıl içinde ya sektör içi konum değişikliği ya da çalışma disiplini değişikliği yapıyor. Bu rakam ümitsizlikten değil, alternatifin gerçek olduğundan bahsediyor.`;
    p5 += `<br><br><strong>Üç.</strong> Bütçe panelindeki rakamlarına bir daha bakarken, "tasarruf hedefleri" bölümüne <strong>psikolojik bir kategori</strong> eklemeyi düşün — örneğin "telafi harcaması". Görünür yapmak, kontrol edebilmenin başlangıcı.`;
    paragraphs.push(p5);

    // Kapanış
    paragraphs.push(`Son söz: senin yaşadığın bu, çağımızda profesyonel olmanın bilinen ama az konuşulan yan etkisi. Yalnız değilsin. Bu raporu okumak için buraya geldiysen, senin payına düşen kısmı zaten yapıyorsun. Sıradaki anketinde — istediğin zaman — başka bir açıdan bakabiliriz.`);

    return {
        ts: Date.now(),
        sector: state.profession,
        sectorName: sectorName,
        stress: stress,
        paragraphs: paragraphs
    };
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

// ============== NOTABLE INSIGHTS ==============

function renderNotableInsights() {
    const sector = SECTOR_STATS[STATE.profession];
    document.getElementById("notableSector").textContent = sector.name;
    const insights = NOTABLE_INSIGHTS[STATE.profession] || NOTABLE_INSIGHTS.other;
    const container = document.getElementById("notableContent");
    container.innerHTML = insights.map((i) => `
        <div class="notable-item">
            <h4>${escapeHtml(i.title)}</h4>
            <p>${i.body}</p>
        </div>
    `).join("");
}

// Sektör değişince notable da güncellensin
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("profession").addEventListener("change", () => {
        if (isPremium()) renderNotableInsights();
    });
});

// ============== GEÇMİŞ RAPORLAR ==============

const REPORTS_KEY = "maddiyat_reports";
const MAX_REPORTS = 20;

function saveReportToHistory(report) {
    let list = [];
    try { list = JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]"); } catch (e) { list = []; }
    list.unshift(report);
    if (list.length > MAX_REPORTS) list = list.slice(0, MAX_REPORTS);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(list));
}

function loadReports() {
    try { return JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]"); } catch (e) { return []; }
}

function renderPastReports() {
    if (!isPremium()) return;
    const reports = loadReports();
    const card = document.getElementById("pastReportsCard");
    const list = document.getElementById("pastReportsList");
    if (reports.length === 0) {
        card.classList.add("hidden");
        return;
    }
    card.classList.remove("hidden");
    list.innerHTML = reports.map((r, idx) => `
        <div class="past-report-item" data-idx="${idx}">
            <div class="past-report-meta">
                <span class="sector">${escapeHtml(r.sectorName)} · Stres ${r.stress}/10</span>
                <span class="date">${new Date(r.ts).toLocaleString("tr-TR")}</span>
            </div>
            <span class="muted small">→ Aç</span>
        </div>
    `).join("");
    list.querySelectorAll(".past-report-item").forEach((el) => {
        el.addEventListener("click", () => {
            const idx = parseInt(el.dataset.idx);
            showReport(reports[idx]);
            document.getElementById("aiReport").scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}

// ============== KICKOFF ==============

document.addEventListener("DOMContentLoaded", () => {
    init();
    if (isPremium()) {
        document.getElementById("premiumSection").classList.remove("hidden");
        renderNotableInsights();
    }
});
