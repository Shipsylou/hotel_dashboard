/* ============================================================================
   TAB 5 — VALORISATION & SCÉNARIOS : DCF, TRI, switcher de scénarios, sensibilité
   ============================================================================ */
window.App = window.App || {};
App.Tabs = App.Tabs || {};

App.Tabs.Valuation = function ValuationTab() {
  const { useState, useMemo } = React;
  const { Card, Button, Field, NumberInput, Select, Fmt, SectionTitle, Icon, StatCard, Badge } = App.UI;
  const ctx = React.useContext(App.Ctx);
  const { currentProject: p, updateProject } = ctx;
  const [metric, setMetric] = useState("ebitda");

  const dcf = useMemo(() => App.Engine.computeDCF(p), [p]);
  const sensitivity = useMemo(() => App.Engine.computeSensitivity(p), [p]);

  function patchVal(key, value) {
    updateProject((proj) => ({ ...proj, valuation: { ...proj.valuation, [key]: value } }));
  }
  function setScenario(s) {
    updateProject((proj) => ({ ...proj, activeScenario: s }));
  }

  const scenarioTone = { prudent: "red", central: "gold", optimiste: "emerald" };

  return React.createElement(
    "div",
    { className: "space-y-6" },
    React.createElement(SectionTitle, { eyebrow: "Analyse de rentabilité", title: "Valorisation, DCF & Scénarios" }),

    // Switcher de scénarios
    React.createElement(
      Card,
      { className: "p-5" },
      React.createElement("h3", { className: "font-serif text-base mb-4" }, "Jeu d'hypothèses actif"),
      React.createElement(
        "div",
        { className: "grid grid-cols-3 gap-3" },
        Object.keys(App.Data.SCENARIO_LABELS).map((key) => {
          const active = p.activeScenario === key;
          const scn = p.scenarios[key];
          return React.createElement(
            "button",
            {
              key,
              onClick: () => setScenario(key),
              className: `text-left rounded-xl border-2 p-4 transition-all ${
                active ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/[0.06]" : "border-[var(--border)] hover:border-[var(--accent-gold)]/40"
              }`,
            },
            React.createElement(
              "div",
              { className: "flex items-center justify-between mb-2" },
              React.createElement("span", { className: "font-serif text-base" }, App.Data.SCENARIO_LABELS[key]),
              active ? React.createElement(Badge, { tone: scenarioTone[key] }, "Actif") : null
            ),
            React.createElement("div", { className: "text-xs text-[var(--text-muted)] space-y-0.5 font-mono" },
              React.createElement("div", null, "TO : " + (scn.occDelta >= 0 ? "+" : "") + Fmt.pct(scn.occDelta)),
              React.createElement("div", null, "ADR : " + (scn.adrDelta >= 0 ? "+" : "") + Fmt.pct(scn.adrDelta)),
              React.createElement("div", null, "Inflation charges : " + (scn.costInflationDelta >= 0 ? "+" : "") + Fmt.pct(scn.costInflationDelta))
            )
          );
        })
      )
    ),

    // Paramètres DCF
    React.createElement(
      Card,
      { className: "p-5" },
      React.createElement("h3", { className: "font-serif text-base mb-4 flex items-center gap-2" }, React.createElement(Icon, { name: "trendUp", size: 16, className: "text-[var(--accent-gold)]" }), "Hypothèses de valorisation (DCF)"),
      React.createElement(
        "div",
        { className: "grid grid-cols-2 md:grid-cols-3 gap-3" },
        React.createElement(Field, { label: "Taux d'actualisation" }, React.createElement(NumberInput, { suffix: "%", step: 0.1, value: Math.round(p.valuation.discountRate * 1000) / 10, onChange: (e) => patchVal("discountRate", Number(e.target.value) / 100) })),
        React.createElement(Field, { label: "Exit Cap Rate" }, React.createElement(NumberInput, { suffix: "%", step: 0.1, value: Math.round(p.valuation.exitCapRate * 1000) / 10, onChange: (e) => patchVal("exitCapRate", Number(e.target.value) / 100) })),
        React.createElement(Field, { label: "Année de sortie" }, React.createElement(Select, { options: [{ value: 7, label: "Année 7" }, { value: 10, label: "Année 10" }], value: p.valuation.exitYear, onChange: (e) => patchVal("exitYear", Number(e.target.value)) }))
      )
    ),

    // Résultats DCF
    React.createElement(
      "div",
      { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
      React.createElement(StatCard, { icon: "dollar", label: "VAN (NPV)", value: Fmt.num0(dcf.npv) + " €", tone: dcf.npv >= 0 ? "emerald" : "red" }),
      React.createElement(StatCard, { icon: "trendUp", label: "TRI (IRR) equity", value: dcf.irr != null ? Fmt.pct(dcf.irr) : "n/d", tone: dcf.irr != null && dcf.irr >= p.valuation.discountRate ? "emerald" : "red" }),
      React.createElement(StatCard, { icon: "calendar", label: "Payback", value: dcf.payback != null ? dcf.payback.toFixed(1) + " ans" : "> horizon" }),
      React.createElement(StatCard, { icon: "landmark", label: `Valeur de sortie (A${dcf.exitYear})`, value: Fmt.num0(dcf.exitValue) + " €", sub: "Produit net : " + Fmt.num0(dcf.netSaleProceeds) + " €" })
    ),

    // Flux equity
    React.createElement(
      Card,
      { className: "overflow-x-auto" },
      React.createElement("div", { className: "px-5 pt-4 pb-2" }, React.createElement("h3", { className: "font-serif text-base" }, "Flux de trésorerie côté equity")),
      React.createElement(
        "table",
        { className: "w-full text-[12.5px] font-mono" },
        React.createElement(
          "tbody",
          null,
          React.createElement(
            "tr",
            { className: "border-b border-[var(--border)]" },
            React.createElement("td", { className: "px-5 py-2 font-sans text-[var(--text-muted)] sticky left-0 bg-[var(--surface)]" }, "Flux equity"),
            dcf.equityCF.map((v, i) =>
              React.createElement("td", { key: i, className: `px-4 py-2 text-right tabular-nums ${v < 0 ? "text-[var(--accent-red)]" : "text-[var(--text)]"}` }, Fmt.num0(v))
            )
          ),
          React.createElement(
            "tr",
            null,
            React.createElement("td", { className: "px-5 py-1.5 font-sans text-[10px] text-[var(--text-muted)] sticky left-0 bg-[var(--surface)]" }, "Période"),
            dcf.equityCF.map((v, i) => React.createElement("td", { key: i, className: "px-4 py-1.5 text-right text-[10px] text-[var(--text-muted)]" }, i === 0 ? "T0" : "A" + i))
          )
        )
      )
    ),

    // Matrice de sensibilité
    React.createElement(
      Card,
      { className: "p-5" },
      React.createElement(
        "div",
        { className: "flex items-center justify-between mb-4 flex-wrap gap-3" },
        React.createElement("h3", { className: "font-serif text-base" }, `Matrice de sensibilité — Année ${sensitivity.stableYear} (stabilisée)`),
        React.createElement(
          "div",
          { className: "flex items-center gap-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-1" },
          React.createElement(Button, { size: "sm", variant: metric === "ebitda" ? "primary" : "ghost", onClick: () => setMetric("ebitda") }, "EBITDA"),
          React.createElement(Button, { size: "sm", variant: metric === "dscr" ? "primary" : "ghost", onClick: () => setMetric("dscr") }, "DSCR")
        )
      ),
      SensitivityGrid(sensitivity, metric, Fmt)
    )
  );
};

function SensitivityGrid(sensitivity, metric, Fmt) {
  const { adrDeltas, occDeltas, matrix } = sensitivity;
  const values = matrix.flat().map((c) => c[metric]).filter((v) => v != null);
  const min = Math.min(...values), max = Math.max(...values);
  function heat(v) {
    if (v == null || max === min) return "rgba(201,162,39,0.12)";
    const t = (v - min) / (max - min); // 0 (rouge) -> 1 (vert)
    const r = Math.round(224 - t * (224 - 31));
    const g = Math.round(85 + t * (169 - 85));
    const b = Math.round(90 + t * (124 - 90));
    return `rgba(${r},${g},${b},0.22)`;
  }
  return React.createElement(
    "div",
    { className: "overflow-x-auto" },
    React.createElement(
      "table",
      { className: "w-full text-xs font-mono border-collapse" },
      React.createElement(
        "thead",
        null,
        React.createElement(
          "tr",
          null,
          React.createElement("th", { className: "px-3 py-2 text-[10px] font-sans text-[var(--text-muted)] text-center border border-[var(--border)]" }, "TO \\ ADR"),
          adrDeltas.map((d, i) => React.createElement("th", { key: i, className: "px-3 py-2 text-[10.5px] font-sans font-medium text-center border border-[var(--border)]" }, (d >= 0 ? "+" : "") + Fmt.pct(d)))
        )
      ),
      React.createElement(
        "tbody",
        null,
        matrix.map((row, ri) =>
          React.createElement(
            "tr",
            { key: ri },
            React.createElement("td", { className: "px-3 py-2 text-[10.5px] font-sans font-medium text-center border border-[var(--border)] bg-[var(--surface-2)]" }, (occDeltas[ri] >= 0 ? "+" : "") + Fmt.pct(occDeltas[ri])),
            row.map((cell, ci) =>
              React.createElement(
                "td",
                { key: ci, className: "px-3 py-2.5 text-center border border-[var(--border)] tabular-nums font-semibold", style: { backgroundColor: heat(cell[metric]) } },
                metric === "ebitda" ? Fmt.num0(cell.ebitda) : cell.dscr != null ? cell.dscr.toFixed(2) + "x" : "—"
              )
            )
          )
        )
      )
    )
  );
}
