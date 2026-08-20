/* ============================================================================
   TAB 5 — VALORISATION & SCÉNARIOS : DCF, Multiple EBITDA & Stress Test
   ============================================================================ */
window.App = window.App || {};
App.Tabs = App.Tabs || {};

App.Tabs.Valuation = function ValuationTab() {
  const { useState, useMemo } = React;
  const { Card, Button, Field, NumberInput, Select, Fmt, SectionTitle, Icon, StatCard, Badge } = App.UI;
  const ctx = React.useContext(App.Ctx);
  const { currentProject: p, updateProject } = ctx;

  const dcf = useMemo(() => App.Engine.computeDCF(p), [p]);

  function patchVal(key, value) {
    updateProject((proj) => ({ ...proj, valuation: { ...proj.valuation, [key]: value } }));
  }
  function setScenario(s) {
    updateProject((proj) => ({ ...proj, activeScenario: s }));
  }

  return React.createElement(
    "div",
    { className: "space-y-6" },
    React.createElement(SectionTitle, { eyebrow: "Ingénierie Financière", title: "Valorisation d'Exit, TRI & Scénarios" }),

    // Switcher de Scénarios
    React.createElement(
      Card,
      { className: "p-5" },
      React.createElement("h3", { className: "font-serif text-base mb-4" }, "Jeu d'hypothèses d'exploitation"),
      React.createElement(
        "div",
        { className: "grid grid-cols-3 gap-3" },
        Object.keys(App.Data.SCENARIO_LABELS).map((key) => {
          const active = p.activeScenario === key;
          return React.createElement(
            "button",
            {
              key,
              onClick: () => setScenario(key),
              className: `text-left rounded-xl border-2 p-4 transition-all ${
                active ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/[0.06]" : "border-[var(--border)] hover:border-[var(--accent-gold)]/40"
              }`,
            },
            React.createElement("div", { className: "font-serif text-base font-bold mb-1" }, App.Data.SCENARIO_LABELS[key]),
            active ? React.createElement(Badge, { tone: "gold" }, "Actif") : null
          );
        })
      )
    ),

    // Parameters DCF & Exit
    React.createElement(
      Card,
      { className: "p-5" },
      React.createElement("h3", { className: "font-serif text-base mb-4 flex items-center gap-2" }, React.createElement(Icon, { name: "trendUp", size: 16, className: "text-[var(--accent-gold)]" }), "Paramètres de revente (Exit Multiple & Cap Rate)"),
      React.createElement(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement(Field, { label: "Multiple EBITDA à la revente (ex: 17x)" }, React.createElement(NumberInput, { suffix: "x", value: p.valuation.exitMultipleEbitda || 17, onChange: (e) => patchVal("exitMultipleEbitda", Number(e.target.value)) })),
        React.createElement(Field, { label: "Taux d'actualisation Equity (%)" }, React.createElement(NumberInput, { suffix: "%", step: 0.1, value: Math.round(p.valuation.discountRate * 1000) / 10, onChange: (e) => patchVal("discountRate", Number(e.target.value) / 100) })),
        React.createElement(Field, { label: "Année de revente (Exit)" }, React.createElement(Select, { options: [{ value: 7, label: "Année 7" }, { value: 10, label: "Année 10" }], value: p.valuation.exitYear, onChange: (e) => patchVal("exitYear", Number(e.target.value)) }))
      )
    ),

    // Métriques clés d'investisseur
    React.createElement(
      "div",
      { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
      React.createElement(StatCard, { icon: "trendUp", label: "TRI Equity (IRR)", value: dcf.irr != null ? Fmt.pct(dcf.irr) : "n/d", tone: "emerald" }),
      React.createElement(StatCard, { icon: "dollar", label: "VAN (NPV) Equity", value: Fmt.num0(dcf.npv) + " €" }),
      React.createElement(StatCard, { icon: "landmark", label: "Valeur de Revente (GAV)", value: Fmt.num0(dcf.exitValue) + " €", sub: "Based on " + (p.valuation.exitMultipleEbitda || 17) + "x EBITDA" }),
      React.createElement(StatCard, { icon: "pieChart", label: "Produit Net de Cession", value: Fmt.num0(dcf.netSaleProceeds) + " €", sub: "Après remboursement dette" })
    )
  );
};
