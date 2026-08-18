/* ============================================================================
   TAB 6 — CAPEX & FF&E : réserve de renouvellement, chronogramme de travaux
   ============================================================================ */
window.App = window.App || {};
App.Tabs = App.Tabs || {};

App.Tabs.Capex = function CapexTab() {
  const { useMemo } = React;
  const { Card, Button, IconButton, Field, NumberInput, TextInput, Select, Fmt, SectionTitle, Icon, EmptyState } = App.UI;
  const ctx = React.useContext(App.Ctx);
  const { currentProject: p, updateProject } = ctx;

  const ffeSchedule = useMemo(() => App.Engine.computeFFESchedule(p, 10), [p]);
  const schedule = p.capex.schedule || [];
  const effectiveFfePct = p.capex.ffePctOverride != null ? p.capex.ffePctOverride : p.params.ffePct;
  const totalHeavyCapex = schedule.reduce((s, c) => s + Number(c.amount || 0), 0);
  const maxYearAmount = Math.max(1, ...Array.from({ length: 10 }, (_, i) => schedule.filter((c) => Number(c.year) === i + 1).reduce((s, c) => s + Number(c.amount || 0), 0)));

  function addRow() {
    updateProject((proj) => ({
      ...proj,
      capex: { ...proj.capex, schedule: [...proj.capex.schedule, { id: App.Data.uid("cx"), year: 1, label: "Nouvel investissement", amount: 100000 }] },
    }));
  }
  function updateRow(id, key, value) {
    updateProject((proj) => ({
      ...proj,
      capex: { ...proj.capex, schedule: proj.capex.schedule.map((c) => (c.id === id ? { ...c, [key]: value } : c)) },
    }));
  }
  function removeRow(id) {
    updateProject((proj) => ({ ...proj, capex: { ...proj.capex, schedule: proj.capex.schedule.filter((c) => c.id !== id) } }));
  }
  function setFfeOverride(value) {
    updateProject((proj) => ({ ...proj, capex: { ...proj.capex, ffePctOverride: value } }));
  }

  return React.createElement(
    "div",
    { className: "space-y-6" },
    React.createElement(SectionTitle, { eyebrow: "Investissements", title: "CAPEX & Réserve FF&E" }),

    // Réserve FF&E
    React.createElement(
      Card,
      { className: "p-5" },
      React.createElement("h3", { className: "font-serif text-base mb-1 flex items-center gap-2" }, React.createElement(Icon, { name: "sliders", size: 16, className: "text-[var(--accent-gold)]" }), "Réserve FF&E (renouvellement mobilier & équipement)"),
      React.createElement("p", { className: "text-xs text-[var(--text-muted)] mb-4" }, "Pourcentage du chiffre d'affaires total réservé chaque année (standard marché : 3 % à 5 %)."),
      React.createElement(
        "div",
        { className: "flex items-end gap-4 mb-5" },
        React.createElement(
          Field,
          { label: "Taux de réserve FF&E" },
          React.createElement(NumberInput, {
            suffix: "%", step: 0.1, min: 0, max: 10,
            value: Math.round(effectiveFfePct * 1000) / 10,
            onChange: (e) => setFfeOverride(Number(e.target.value) / 100),
            className: "w-32",
          })
        ),
        React.createElement("input", {
          type: "range", min: 3, max: 5, step: 0.1,
          value: Math.round(effectiveFfePct * 1000) / 10,
          onChange: (e) => setFfeOverride(Number(e.target.value) / 100),
          className: "flex-1 accent-[var(--accent-gold)]",
        }),
        React.createElement(Button, { variant: "ghost", size: "sm", onClick: () => setFfeOverride(null) }, "Réinitialiser (défaut BP)")
      ),
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
              { className: "text-left border-b border-[var(--border)]" },
              React.createElement("th", { className: "px-3 py-2 font-sans font-medium text-[var(--text-muted)]" }, "Poste"),
              ffeSchedule.map((r) => React.createElement("th", { key: r.year, className: "px-3 py-2 font-sans font-medium text-[var(--text-muted)] text-right" }, "A" + r.year))
            )
          ),
          React.createElement(
            "tbody",
            null,
            React.createElement(
              "tr",
              null,
              React.createElement("td", { className: "px-3 py-2 font-sans text-[var(--text-muted)]" }, "CA Total"),
              ffeSchedule.map((r) => React.createElement("td", { key: r.year, className: "px-3 py-2 text-right tabular-nums text-[var(--text-muted)]" }, Fmt.num0(r.totalRev)))
            ),
            React.createElement(
              "tr",
              { className: "bg-[var(--accent-gold)]/[0.06]" },
              React.createElement("td", { className: "px-3 py-2 font-sans font-semibold" }, "Réserve FF&E"),
              ffeSchedule.map((r) => React.createElement("td", { key: r.year, className: "px-3 py-2 text-right tabular-nums font-semibold" }, Fmt.num0(r.ffeReserve)))
            )
          )
        )
      )
    ),

    // Chronogramme d'investissements lourds
    React.createElement(
      Card,
      { className: "p-5" },
      React.createElement(
        "div",
        { className: "flex items-center justify-between mb-4" },
        React.createElement("h3", { className: "font-serif text-base flex items-center gap-2" }, React.createElement(Icon, { name: "calendar", size: 16, className: "text-[var(--accent-gold)]" }), "Chronogramme d'investissements lourds & plan de rénovation"),
        React.createElement(Button, { variant: "secondary", size: "sm", icon: "plus", onClick: addRow }, "Ajouter une ligne")
      ),

      schedule.length === 0
        ? React.createElement(EmptyState, { icon: "calendar", title: "Aucun investissement lourd planifié", message: "Ajoutez les travaux de rénovation ou d'équipement majeurs impactant la trésorerie sur des années spécifiques.", action: React.createElement(Button, { variant: "primary", icon: "plus", onClick: addRow }, "Ajouter une ligne") })
        : React.createElement(
            "div",
            { className: "space-y-4" },
            React.createElement(
              "div",
              { className: "overflow-x-auto" },
              React.createElement(
                "table",
                { className: "w-full text-sm" },
                React.createElement(
                  "thead",
                  null,
                  React.createElement(
                    "tr",
                    { className: "text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)] border-b border-[var(--border)]" },
                    ["Année", "Libellé", "Montant", ""].map((h, i) => React.createElement("th", { key: i, className: "px-3 py-2 font-medium" }, h))
                  )
                ),
                React.createElement(
                  "tbody",
                  null,
                  schedule.map((c) =>
                    React.createElement(
                      "tr",
                      { key: c.id, className: "border-b border-[var(--border)] last:border-0" },
                      React.createElement("td", { className: "px-3 py-1.5" }, React.createElement(Select, {
                        options: Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: "Année " + (i + 1) })),
                        value: c.year, onChange: (e) => updateRow(c.id, "year", Number(e.target.value)), className: "w-32",
                      })),
                      React.createElement("td", { className: "px-3 py-1.5" }, React.createElement(TextInput, { value: c.label, onChange: (e) => updateRow(c.id, "label", e.target.value), className: "min-w-[220px]" })),
                      React.createElement("td", { className: "px-3 py-1.5" }, React.createElement(NumberInput, { suffix: "€", value: c.amount, onChange: (e) => updateRow(c.id, "amount", Number(e.target.value)), className: "w-36" })),
                      React.createElement("td", { className: "px-3 py-1.5" }, React.createElement(IconButton, { name: "trash", size: 14, onClick: () => removeRow(c.id), className: "hover:text-[var(--accent-red)]" }))
                    )
                  )
                )
              )
            ),

            React.createElement(
              "div",
              { className: "pt-2" },
              React.createElement("div", { className: "text-xs text-[var(--text-muted)] mb-2" }, "Répartition dans le temps — Total : " + Fmt.num0(totalHeavyCapex) + " €"),
              React.createElement(
                "div",
                { className: "flex items-end gap-2 h-32" },
                Array.from({ length: 10 }, (_, i) => {
                  const yearAmount = schedule.filter((c) => Number(c.year) === i + 1).reduce((s, c) => s + Number(c.amount || 0), 0);
                  const h = Math.max(2, (yearAmount / maxYearAmount) * 100);
                  return React.createElement(
                    "div",
                    { key: i, className: "flex-1 flex flex-col items-center gap-1" },
                    React.createElement("div", { className: "text-[9px] font-mono text-[var(--text-muted)]" }, yearAmount ? Fmt.num0(yearAmount / 1000) + "k" : ""),
                    React.createElement("div", {
                      className: "w-full rounded-t-md transition-all",
                      style: { height: h + "%", backgroundColor: yearAmount ? "var(--accent-gold)" : "var(--border)" },
                    }),
                    React.createElement("div", { className: "text-[10px] text-[var(--text-muted)]" }, "A" + (i + 1))
                  );
                })
              )
            )
          )
    )
  );
};
