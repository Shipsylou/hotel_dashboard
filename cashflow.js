/* ============================================================================
   TAB 4 — CASHFLOW & FINANCEMENT : simulateur d'emprunt, amortissement, DSCR
   ============================================================================ */
window.App = window.App || {};
App.Tabs = App.Tabs || {};

App.Tabs.Cashflow = function CashflowTab() {
  const { useMemo, useRef, useEffect } = React;
  const { Card, Field, NumberInput, Fmt, SectionTitle, Icon, StatCard } = App.UI;
  const ctx = React.useContext(App.Ctx);
  const { currentProject: p, updateProject } = ctx;
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  if (!p) return null;

  const cashflow = useMemo(() => App.Engine.computeCashflow(p, 10), [p]);
  const uses = useMemo(() => App.Engine.computeUsesAndSources(p), [p]);
  const debtSchedule = useMemo(() => App.Engine.computeTotalDebtSchedule(p, 10), [p]);

  const targetDscr = p.financing?.dscrTarget || 1.25;

  const avgDscr = useMemo(() => {
    const vals = cashflow.filter((r) => r.dscr != null).map((r) => r.dscr);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [cashflow]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();
    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#8B93AC" : "#5B6478";
    const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    chartInstance.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: cashflow.map((r) => "A" + r.year),
        datasets: [
          { label: "DSCR", data: cashflow.map((r) => r.dscr), borderColor: "#C9A227", backgroundColor: "#C9A22733", tension: 0.3, pointRadius: 3, spanGaps: true },
          { label: "Seuil cible " + targetDscr + "x", data: cashflow.map(() => targetDscr), borderColor: "#E0555A", borderDash: [6, 4], pointRadius: 0 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: textColor }, grid: { display: false } },
          y: { ticks: { color: textColor }, grid: { color: gridColor }, title: { display: true, text: "DSCR (x)", color: textColor } },
        },
      },
    });
    return () => chartInstance.current && chartInstance.current.destroy();
  }, [cashflow, targetDscr]);

  return React.createElement(
    "div",
    { className: "space-y-6" },
    React.createElement(SectionTitle, { eyebrow: "Structuration financière", title: "Cashflow & Dette" }),

    // Ratios de Financement
    React.createElement(
      "div",
      { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
      React.createElement(StatCard, { icon: "landmark", label: "Dette Totale à Lever", value: Fmt.num0(uses.totalDette) + " €" }),
      React.createElement(StatCard, { icon: "pieChart", label: "Equity Sponsor Requis", value: Fmt.num0(uses.equityCalculated) + " €" }),
      React.createElement(StatCard, { icon: "scale", label: "DSCR moyen (10 ans)", value: avgDscr != null ? avgDscr.toFixed(2) + "x" : "—", tone: avgDscr != null && avgDscr >= targetDscr ? "emerald" : "red" }),
      React.createElement(StatCard, { icon: "banknote", label: "Dette Restante A10", value: Fmt.num0(debtSchedule[9]?.endingBalance || 0) + " €" })
    ),

    // Graphique DSCR
    React.createElement(
      Card,
      { className: "p-5" },
      React.createElement("h3", { className: "font-serif text-base mb-4" }, "Couverture de la dette (DSCR) — projection 10 ans"),
      React.createElement("div", { className: "h-64" }, React.createElement("canvas", { ref: chartRef }))
    ),

    // Tableau Trésorerie
    React.createElement(
      Card,
      { className: "overflow-hidden" },
      React.createElement("div", { className: "px-5 pt-4 pb-2" }, React.createElement("h3", { className: "font-serif text-base" }, "Projection de trésorerie — 10 ans")),
      React.createElement(
        "div",
        { className: "overflow-x-auto" },
        React.createElement(
          "table",
          { className: "w-full text-[12.5px] font-mono" },
          React.createElement(
            "thead",
            null,
            React.createElement(
              "tr",
              { className: "border-b border-[var(--border)] text-left" },
              ["Poste", ...cashflow.map((r) => "Année " + r.year)].map((h, i) =>
                React.createElement("th", { key: i, className: `px-4 py-2.5 font-sans font-medium text-[var(--text-muted)] ${i > 0 ? "text-right" : "sticky left-0 bg-[var(--surface)] min-w-[180px]"}` }, h)
              )
            )
          ),
          React.createElement(
            "tbody",
            null,
            cfRow("EBITDA", cashflow.map((r) => r.ebitda)),
            cfRow("CAPEX lourds", cashflow.map((r) => -r.capexHeavy)),
            cfRow("Intérêts", cashflow.map((r) => -r.interest)),
            cfRow("Principal remboursé", cashflow.map((r) => -r.principal)),
            cfRow("Service de la dette", cashflow.map((r) => -r.debtService), true),
            cfRow("FLUX NET DE TRÉSORERIE", cashflow.map((r) => r.netCashFlow), true, "gold"),
            cfRow("Flux cumulé", cashflow.map((r) => r.cumulativeCashFlow), true),
            React.createElement(
              "tr",
              { className: "border-t border-[var(--border)]" },
              React.createElement("td", { className: "px-4 py-2 font-sans font-semibold sticky left-0 bg-[var(--surface)]" }, "DSCR"),
              cashflow.map((r) =>
                React.createElement(
                  "td",
                  { key: r.year, className: `px-4 py-2 text-right tabular-nums font-semibold ${r.dscr != null && r.dscr < targetDscr ? "text-[var(--accent-red)]" : "text-[var(--accent-emerald)]"}` },
                  r.dscr != null ? r.dscr.toFixed(2) + "x" : "—"
                )
              )
            )
          )
        )
      )
    )
  );

  function cfRow(label, values, bold, highlight) {
    const bg = highlight === "gold" ? "bg-[var(--accent-gold)]/[0.07]" : "";
    return React.createElement(
      "tr",
      { key: label, className: `border-b border-[var(--border)]/60 ${bg}` },
      React.createElement("td", { className: `px-4 py-2 font-sans sticky left-0 bg-[var(--surface)] ${bg} ${bold ? "font-semibold text-[var(--text)]" : "text-[var(--text-muted)]"} whitespace-nowrap` }, label),
      values.map((v, i) =>
        React.createElement("td", { key: i, className: `px-4 py-2 text-right tabular-nums ${bold ? "font-semibold text-[var(--text)]" : ""} ${v < 0 ? "text-[var(--accent-red)]" : ""}` }, Fmt.num0(v))
      )
    );
  }
};
