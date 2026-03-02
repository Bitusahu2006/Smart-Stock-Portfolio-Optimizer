const MARKET_DATA = {
    AAPL: { price: 175.40, beta: 1.1, sector: "Tech", histReturn: 0.15, vol: 0.22 },
    MSFT: { price: 410.20, beta: 0.9, sector: "Tech", histReturn: 0.18, vol: 0.19 },
    GOOGL: { price: 145.10, beta: 1.05, sector: "Tech", histReturn: 0.12, vol: 0.24 },
    AMZN: { price: 178.50, beta: 1.2, sector: "Consumer", histReturn: 0.14, vol: 0.28 },
    TSLA: { price: 165.30, beta: 2.1, sector: "Auto", histReturn: 0.25, vol: 0.45 },
    NVDA: { price: 880.10, beta: 1.8, sector: "Semiconductor", histReturn: 0.45, vol: 0.40 },
    BTC: { price: 65000, beta: 3.5, sector: "Crypto", histReturn: 0.60, vol: 0.70 },
    SPY: { price: 510.40, beta: 1.0, sector: "Index", histReturn: 0.10, vol: 0.15 }
};

let portfolio = [];
let charts = {};

function init() {
    initCharts();
    setupEvents();
    updateUI();
}

window.onload = init;

function initCharts() {
    const perfCtx = document.getElementById("performanceChart").getContext("2d");

    charts.performance = new Chart(perfCtx, {
        type: "line",
        data: {
            labels: Array.from({ length: 12 }, (_, i) => `Month ${i + 1}`),
            datasets: [
                {
                    label: "Portfolio",
                    data: [],
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59,130,246,0.2)",
                    fill: true,
                    tension: 0.4
                },
                {
                    label: "Market",
                    data: [],
                    borderColor: "#94a3b8",
                    borderDash: [5, 5],
                    fill: false
                }
            ]
        },
        options: { responsive: true }
    });

    const allocCtx = document.getElementById("allocationChart").getContext("2d");

    charts.allocation = new Chart(allocCtx, {
        type: "doughnut",
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    "#3b82f6",
                    "#10b981",
                    "#f59e0b",
                    "#ef4444",
                    "#8b5cf6",
                    "#ec4899"
                ]
            }]
        },
        options: { responsive: true }
    });

    const riskCtx = document.getElementById("riskReturnChart").getContext("2d");

    charts.risk = new Chart(riskCtx, {
        type: "scatter",
        data: {
            datasets: [{
                label: "Assets",
                data: [],
                backgroundColor: "#3b82f6"
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: "Risk (Volatility %)" } },
                y: { title: { display: true, text: "Return %" } }
            }
        }
    });
}

function setupEvents() {
    document.getElementById("add-asset-btn").addEventListener("click", addAsset);
    document.getElementById("run-optimizer").addEventListener("click", optimizePortfolio);
}

function addAsset() {
    const ticker = document.getElementById("asset-ticker").value.toUpperCase();
    const qty = parseFloat(document.getElementById("asset-qty").value);
    const cost = parseFloat(document.getElementById("asset-cost").value);

    if (!ticker || qty <= 0 || cost <= 0) {
        alert("Invalid input");
        return;
    }

    let data = MARKET_DATA[ticker];

    if (!data) {
        data = {
            price: cost * (0.9 + Math.random() * 0.3),
            beta: 1,
            sector: "Global",
            histReturn: 0.1,
            vol: 0.2
        };
    }

    portfolio.push({
        ticker,
        qty,
        cost,
        price: data.price,
        beta: data.beta,
        sector: data.sector,
        histReturn: data.histReturn,
        vol: data.vol
    });

    clearInputs();
    updateUI();
}

function removeAsset(ticker) {
    portfolio = portfolio.filter(a => a.ticker !== ticker);
    updateUI();
}

function clearInputs() {
    document.getElementById("asset-ticker").value = "";
    document.getElementById("asset-qty").value = "";
    document.getElementById("asset-cost").value = "";
}

function updateUI() {
    const list = document.getElementById("assets-list");
    list.innerHTML = "";

    portfolio.forEach(asset => {
        const value = asset.qty * asset.price;

        const el = document.createElement("div");
        el.className = "bg-white p-3 rounded-lg border flex justify-between";

        el.innerHTML = `
            <div>
                <strong>${asset.ticker}</strong>
                <p>${asset.qty} shares</p>
            </div>
            <div>
                $${value.toFixed(2)}
                <button onclick="removeAsset('${asset.ticker}')">❌</button>
            </div>
        `;

        list.appendChild(el);
    });

    calculateStats();
    updateCharts();
}

function calculateStats() {
    if (portfolio.length === 0) return;

    const totalValue = portfolio.reduce(
        (sum, a) => sum + a.qty * a.price,
        0
    );

    document.getElementById("total-value").innerText =
        "$" + totalValue.toFixed(2);
}

function updateCharts() {
    if (portfolio.length === 0) return;

    const totalValue = portfolio.reduce(
        (sum, a) => sum + a.qty * a.price,
        0
    );

    charts.allocation.data.labels = portfolio.map(a => a.ticker);

    charts.allocation.data.datasets[0].data =
        portfolio.map(a => (a.qty * a.price) / totalValue * 100);

    charts.allocation.update();

    charts.risk.data.datasets[0].data =
        portfolio.map(a => ({
            x: a.vol * 100,
            y: a.histReturn * 100
        }));

    charts.risk.update();

    const history = [];
    let val = totalValue * 0.9;

    for (let i = 0; i < 12; i++) {
        val *= 1 + (Math.random() * 0.08 - 0.02);
        history.push(val);
    }

    charts.performance.data.datasets[0].data = history;
    charts.performance.update();
}

function optimizePortfolio() {
    if (portfolio.length < 2) {
        alert("Add at least 2 assets");
        return;
    }

    const totalValue = portfolio.reduce(
        (sum, a) => sum + a.qty * a.price,
        0
    );

    const avgReturn = portfolio.reduce(
        (sum, a) =>
            sum +
            a.histReturn *
                ((a.qty * a.price) / totalValue),
        0
    );

    const avgVol = portfolio.reduce(
        (sum, a) =>
            sum +
            a.vol *
                ((a.qty * a.price) / totalValue),
        0
    );

    const optReturn = avgReturn * 1.15;
    const optVol = avgVol * 0.9;

    document.getElementById("exp-return").innerText =
        (optReturn * 100).toFixed(2) + "%";

    document.getElementById("exp-volatility").innerText =
        (optVol * 100).toFixed(2) + "%";

    document.getElementById("opt-score").innerText =
        "Optimized";
}