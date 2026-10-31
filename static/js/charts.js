// ============================================================================
// CloudKeeper — Dashboard rendering (shape-tolerant)
// Auto-detects common field names so the UI works with the modules/ output
// ============================================================================

const fmtMoney = (n) =>
  '$' + Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
const fmtMoneyShort = (n) =>
  '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

const badgeFor = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'critical') return '<span class="ck-badge critical">CRITICAL</span>';
  if (s === 'warning')  return '<span class="ck-badge warning">WARNING</span>';
  if (s === 'ok' || s === 'healthy' || s === 'compliant')
    return '<span class="ck-badge ok">OK</span>';
  return `<span class="ck-badge muted">${status || '—'}</span>`;
};

// pick the first key that exists and is not undefined
const pick = (obj, ...keys) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
};

// ---------- main entry ----------
function renderDashboard() {
  const data = window.CK_DASHBOARD;
  if (!data) return;
  hydrateKPIs(data.summary, data.alerts);
  renderTrend(data.trend);
  renderDonut(data.summary);
  renderTopServices(data.topServices);
  renderAlerts(data.alerts);
}

// ---------- KPI cards ----------
function hydrateKPIs(summary) {
  const providers =
    pick(summary, 'providers', 'by_provider', 'clouds') || {};

  const totalCost =
    pick(summary, 'total_cost', 'total', 'grand_total', 'total_spend') ??
    Object.values(providers).reduce(
      (a, p) => a + Number(pick(p, 'total', 'cost', 'total_cost', 'spend') || 0),
      0
    );

  const totalEl = document.getElementById('kpi-total');
  if (totalEl) totalEl.textContent = fmtMoney(totalCost);

  const map = { aws: ['AWS', 'aws'], azure: ['Azure', 'azure'], gcp: ['GCP', 'gcp'] };
  for (const [key, aliases] of Object.entries(map)) {
    let p = {};
    for (const a of aliases) {
      if (providers[a]) { p = providers[a]; break; }
    }
    const cost = Number(pick(p, 'total', 'cost', 'total_cost', 'spend') || 0);
    const costEl = document.getElementById(`kpi-${key}`);
    if (costEl) costEl.textContent = fmtMoney(cost);

    const alertEl = document.getElementById(`kpi-${key}-alert`);
    if (alertEl) {
      const status = pick(p, 'status', 'alert', 'budget_status', 'level') || 'ok';
      const pct = pick(p, 'budget_used_pct', 'usage_pct', 'percent_used', 'pct');
      alertEl.innerHTML =
        badgeFor(status) +
        (pct != null ? ` <span class="ck-mono">${Number(pct).toFixed(1)}%</span>` : '');
    }
  }
}

// ---------- trend chart ----------
let __trendChart = null;
function renderTrend(trend) {
  const canvas = document.getElementById('trendChart');
  if (!canvas || typeof Chart === 'undefined') return;

  // Two possible shapes:
  //  A) { labels: [...], series: { AWS: [...], Azure: [...], GCP: [...] } }
  //  B) [ { date, AWS, Azure, GCP }, ... ]
  let labels = [];
  let series = {};

  if (Array.isArray(trend)) {
    labels = trend.map((r) => pick(r, 'date', 'day', 'label') || '');
    series = { AWS: [], Azure: [], GCP: [] };
    for (const row of trend) {
      series.AWS.push(Number(pick(row, 'AWS', 'aws') || 0));
      series.Azure.push(Number(pick(row, 'Azure', 'azure') || 0));
      series.GCP.push(Number(pick(row, 'GCP', 'gcp') || 0));
    }
  } else {
    labels = pick(trend, 'labels', 'dates', 'days') || [];
    series = pick(trend, 'series', 'by_provider', 'data') || {};
  }

  const ctx = canvas.getContext('2d');
  const palette = { AWS: '#ff9900', Azure: '#0078d4', GCP: '#ea4335' };

  const mkGradient = (hex) => {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height || 300);
    const h = hex.replace('#', '');
    const n = parseInt(h, 16);
    const r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
    g.addColorStop(0, `rgba(${r},${gg},${b},0.35)`);
    g.addColorStop(1, `rgba(${r},${gg},${b},0.0)`);
    return g;
  };

  const datasets = Object.entries(series).map(([name, values]) => {
    const color = palette[name] || '#6366f1';
    return {
      label: name,
      data: values,
      borderColor: color,
      backgroundColor: mkGradient(color),
      borderWidth: 2.5, fill: true, tension: 0.4,
      pointRadius: 0, pointHoverRadius: 5,
      pointHoverBackgroundColor: color,
      pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2,
    };
  });

  if (__trendChart) __trendChart.destroy();
  __trendChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top', align: 'end',
          labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8,
                    padding: 16, font: { family: 'Inter', size: 12 } },
        },
        tooltip: {
          backgroundColor: '#0f172a', padding: 10, cornerRadius: 8,
          callbacks: { label: (c) => ` ${c.dataset.label}: ${fmtMoney(c.parsed.y)}` },
        },
      },
      scales: {
        x: { grid: { display: false },
             ticks: { color: '#64748b', font: { size: 11 }, maxTicksLimit: 10 } },
        y: { grid: { color: '#eef2f7' }, border: { display: false },
             ticks: { color: '#64748b', font: { size: 11 },
                      callback: (v) => fmtMoneyShort(v) } },
      },
      animation: { duration: 800, easing: 'easeOutCubic' },
    },
  });
}

// ---------- donut ----------
let __donutChart = null;
function renderDonut(summary) {
  const canvas = document.getElementById('donutChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const providers = pick(summary, 'providers', 'by_provider', 'clouds') || {};
  const labels = [], values = [], colors = [];
  const palette = { AWS: '#ff9900', Azure: '#0078d4', GCP: '#ea4335' };

  for (const [name, p] of Object.entries(providers)) {
    labels.push(name);
    values.push(Number(pick(p, 'total', 'cost', 'total_cost', 'spend') || 0));
    colors.push(palette[name] || '#6366f1');
  }
  const total = values.reduce((a, b) => a + b, 0);
  const centerEl = document.getElementById('donut-total');
  if (centerEl) centerEl.textContent = fmtMoneyShort(total);

  if (__donutChart) __donutChart.destroy();
  __donutChart = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors,
              borderColor: '#fff', borderWidth: 3, hoverOffset: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '72%',
      plugins: {
        legend: { position: 'bottom',
                  labels: { usePointStyle: true, pointStyle: 'circle',
                            boxWidth: 8, padding: 14, font: { size: 12 } } },
        tooltip: { backgroundColor: '#0f172a', padding: 10, cornerRadius: 8,
                   callbacks: { label: (c) => {
                     const v = c.parsed || 0;
                     const pct = total ? ((v / total) * 100).toFixed(1) : '0.0';
                     return ` ${c.label}: ${fmtMoney(v)} (${pct}%)`; } } },
      },
      animation: { animateRotate: true, duration: 900, easing: 'easeOutCubic' },
    },
  });
}

// ---------- top services ----------
function renderTopServices(topServices) {
  const body = document.getElementById('top-services-body');
  if (!body) return;

  const rows = Array.isArray(topServices)
    ? topServices
    : pick(topServices, 'services', 'top_services', 'items') || [];

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="3" class="ck-loading">No data</td></tr>';
    return;
  }

  body.innerHTML = rows.slice(0, 5).map((r) => {
    const provider = pick(r, 'provider', 'cloud') || '—';
    const service  = pick(r, 'service', 'name') || '—';
    const cost     = Number(pick(r, 'monthly_cost', 'cost', 'amount') || 0);
    return `<tr>
      <td><span class="ck-badge info">${provider}</span></td>
      <td>${service}</td>
      <td class="text-end ck-cost">${fmtMoney(cost)}</td>
    </tr>`;
  }).join('');
}

// ---------- alerts panel ----------
function renderAlerts(alerts) {
  const body = document.getElementById('alerts-body');
  if (!body) return;

  const rows = Array.isArray(alerts) ? alerts : pick(alerts, 'alerts', 'items') || [];

  if (!rows.length) {
    body.innerHTML =
      '<div class="ck-loading"><i class="fa-solid fa-circle-check text-success"></i> All budgets healthy</div>';
    return;
  }

  body.innerHTML = rows.map((a) => {
    const status   = pick(a, 'status', 'level', 'severity') || 'info';
    const provider = pick(a, 'provider', 'cloud') || '—';
    const msg      = pick(a, 'message', 'detail', 'text') || '';
    const pct      = pick(a, 'usage_pct', 'budget_used_pct', 'percent_used', 'pct');
    const budget   = pick(a, 'budget', 'budget_amount');

    const sev =
      String(status).toLowerCase() === 'critical' ? 'critical' :
      String(status).toLowerCase() === 'warning'  ? 'warning'  : 'ok';

    return `<div class="mb-3">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <div><strong>${provider}</strong> ${badgeFor(status)}</div>
        ${pct != null ? `<span class="ck-mono">${Number(pct).toFixed(1)}%</span>` : ''}
      </div>
      <div class="ck-progress">
        <div class="ck-progress-fill ${sev}"
             style="width: ${Math.min(Number(pct || 0), 100)}%"></div>
      </div>
      <div class="small text-muted mt-1">
        ${msg}${budget != null ? ` · budget ${fmtMoney(budget)}` : ''}
      </div>
    </div>`;
  }).join('');
}