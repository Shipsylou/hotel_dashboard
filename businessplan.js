/* ============================================================================
   TAB 2 — BUSINESS PLAN (USALI 12) : P&L normalisé, hypothèses, CompSet Flash
   ============================================================================ */
window.App = window.App || {};
App.Tabs = App.Tabs || {};

const USALI_ROWS = [
  { section: "Indicateurs clés" },
  { key: "occ", label: "Taux d'occupation", kind: "pct" },
  { key: "adr", label: "ADR (prix moyen)", kind: "currency" },
  { key: "revpar", label: "RevPAR", kind: "currency", bold: true },
  { section: "Revenus" },
  { key: "roomsRev", label: "CA Hébergement", kind: "currency" },
  { key: "fbRev", label: "CA Restauration (F&B)", kind: "currency" },
  { key: "otherRev", label: "CA Autres produits", kind: "currency" },
  { key: "totalRev", label: "CHIFFRE D'AFFAIRES TOTAL", kind: "currency", bold: true, highlight: "text" },
  { section: "Charges départementales" },
  { key: "roomsExp", label: "Charges Hébergement", kind: "currency" },
  { key: "fbExp", label: "Charges Restauration", kind: "currency" },
  { key: "otherExp", label: "Charges Autres", kind: "currency" },
  { key: "totalDeptExp", label: "Total charges départementales", kind: "currency", bold: true },
  { key: "deptProfit", label: "Profit départemental", kind: "currency", bold: true },
  { section: "Charges non-distribuées" },
  { key: "ag", label: "Administration & Général", kind: "currency" },
  { key: "sm", label: "Marketing & Ventes", kind: "currency" },
  { key: "pom", label: "Maintenance (Property Ops)", kind: "currency" },
  { key: "utilities", label: "Énergie / Utilities", kind: "currency" },
  { key: "undistributed", label: "Total charges non-distribuées", kind: "currency", bold: true },
  { key: "gop", label: "GOP — GROSS OPERATING PROFIT", kind: "currency", bold: true, highlight: "gold" },
  { key: "gopPct", label: "GOP en % du CA", kind: "pct", muted: true },
  { section: "Charges non-opérationnelles" },
  { key: "mgmtFee", label: "Frais de gestion", kind: "currency" },
  { key: "propertyTax", label: "Taxe foncière / CFE", kind: "currency" },
  { key: "insurance", label: "Assurances", kind: "currency" },
  { key: "ffeReserve", label: "Réserve FF&E", kind: "currency" },
  { key: "nonOpTotal", label: "Total charges non-opérationnelles", kind: "currency", bold: true },
  { key: "ebitda", label: "EBITDA", kind: "currency", bold: true, highlight: "emerald" },
  { key: "ebitdaPct", label: "EBITDA en % du CA", kind: "pct", muted: true },
];

App.Tabs.BusinessPlan = function BusinessPlan() {
  const { useState, useMemo } = React;
  const { Card, Button, Field, NumberInput, Textarea, Fmt, SectionTitle, Badge, Icon, TextInput } = App.UI;
  const ctx = React.useContext(App.Ctx);
  const { currentProject: p, updateProject } = ctx;

  const [compsetCity, setCompsetCity] = useState(p.city || "");

  const usali = useMemo(() => App.Engine.computeUSALI(p, 10), [p]);
  const marketIndices = useMemo(() => {
    const probe = { ...p, city: compsetCity };
    return App.Engine.computeMarketIndices(probe);
  }, [p, compsetCity]);

  function patchParams(key, value) {
    updateProject((proj) => ({ ...proj, params: { ...proj.params, [key]: value } }));
  }
  function patchRamp(idx, value) {
    updateProject((proj) => {
      const rampUp = proj.params.rampUp.slice();
      rampUp[idx] = value;
      return { ...proj, params: { ...proj.params, rampUp } };
    });
  }

  const numField = (label, key, opts) =>
    React.createElement(
      Field,
      { label },
      React.createElement(NumberInput, {
        value: opts && opts.isPct ? Math.round(p.params[key] * 1000) / 10 : p.params[key],
        step: opts && opts.step != null ? opts.step : opts && opts.isPct ? 0.1 : 1,
        suffix: opts && opts.isPct ? "%" : "€",
        onChange: (e) => {
          const raw = Number(e.target.value);
          patchParams(key, opts && opts.isPct ? raw / 100 : raw);
        },
      })
    );

  return React.createElement(
    "div",
    { className: "space-y-6" },
    React.createElement(SectionTitle, {
      eyebrow: "Modélisation financière",
      title: "Business Plan — Compte de résultat USALI",
      right: React.createElement(Badge, { tone: "gold" }, "Scénario : " + App.Data.SCENARIO_LABELS[p.activeScenario]),
    }),

    React.createElement(
      "div",
      { className: "grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start" },

      // ---- Colonne principale --------------------------------------------
      React.createElement(
        "div",
        { className: "space-y-6 min-w-0" },

        // Paramètres d'exploitation
        React.createElement(
          Card,
          { className: "p-5" },
          React.createElement("h3", { className: "font-serif text-base mb-4 flex items-center gap-2" }, React.createElement(Icon, { name: "sliders", size: 16, className: "text-[var(--accent-gold)]" }), "Paramètres d'exploitation"),

          React.createElement("div", { className: "text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2" }, "Revenus & montée en charge"),
          React.createElement(
            "div",
            { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-5" },
            numField("ADR stabilisé", "adr"),
            numField("TO stabilisé", "occ", { isPct: true }),
            numField("Inflation CA / an", "revInflation", { isPct: true }),
            numField("Inflation charges / an", "costInflation", { isPct: true }),
            React.createElement(Field, { label: "Ramp-up TO — Année 1" }, React.createElement(NumberInput, { suffix: "%", value: Math.round(p.params.rampUp[0] * 1000) / 10, onChange: (e) => patchRamp(0, Number(e.target.value) / 100) })),
            React.createElement(Field, { label: "Ramp-up TO — Année 2" }, React.createElement(NumberInput, { suffix: "%", value: Math.round(p.params.rampUp[1] * 1000) / 10, onChange: (e) => patchRamp(1, Number(e.target.value) / 100) })),
            React.createElement(Field, { label: "Ramp-up TO — Année 3" }, React.createElement(NumberInput, { suffix: "%", value: Math.round(p.params.rampUp[2] * 1000) / 10, onChange: (e) => patchRamp(2, Number(e.target.value) / 100) })),
            numField("F&B en % du CA héberg.", "fbPct", { isPct: true })
          ),

          React.createElement("div", { className: "text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2" }, "Ratios de charges départementales (% du CA du poste)"),
          React.createElement(
            "div",
            { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-5" },
            numField("Autres produits en % héberg.", "otherPct", { isPct: true }),
            numField("Charges Hébergement", "roomsExpPct", { isPct: true }),
            numField("Charges Restauration", "fbExpPct", { isPct: true }),
            numField("Charges Autres", "otherExpPct", { isPct: true })
          ),

          React.createElement("div", { className: "text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2" }, "Charges non-distribuées (% du CA total)"),
          React.createElement(
            "div",
            { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-5" },
            numField("Administration & Général", "agPct", { isPct: true }),
            numField("Marketing & Ventes", "smPct", { isPct: true }),
            numField("Maintenance", "pomPct", { isPct: true }),
            numField("Énergie / Utilities", "utilitiesPct", { isPct: true })
          ),

          React.createElement("div", { className: "text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2" }, "Charges fixes & réserve FF&E (% du CA total)"),
          React.createElement(
            "div",
            { className: "grid grid-cols-2 md:grid-cols-4 gap-3" },
            numField("Frais de gestion", "mgmtFeePct", { isPct: true }),
            numField("Taxe foncière", "propertyTaxPct", { isPct: true }),
            numField("Assurances", "insurancePct", { isPct: true }),
            numField("Réserve FF&E", "ffePct", { isPct: true })
          )
        ),

        // Tableau USALI
        React.createElement(
          Card,
          { className: "overflow-hidden" },
          React.createElement("div", { className: "px-5 pt-4 pb-2 flex items-center justify-between" },
            React.createElement("h3", { className: "font-serif text-base" }, "Compte de résultat normalisé — 10 ans"),
            React.createElement("span", { className: "text-[11px] text-[var(--text-muted)]" }, "Cellules calculées en lecture seule")
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
                  { className: "sticky top-0 bg-[var(--surface)]" },
                  React.createElement("th", { className: "text-left font-sans font-medium text-[var(--text-muted)] px-4 py-2.5 sticky left-0 bg-[var(--surface)] min-w-[220px]" }, "Poste"),
                  usali.map((r) => React.createElement("th", { key: r.year, className: "text-right font-sans font-medium text-[var(--text-muted)] px-3 py-2.5 min-w-[92px]" }, "Année " + r.year))
                )
              ),
              React.createElement(
                "tbody",
                null,
                USALI_ROWS.map((row, i) => {
                  if (row.section) {
                    return React.createElement(
                      "tr",
                      { key: "s" + i, className: "bg-[var(--surface-2)]/60" },
                      React.createElement("td", { colSpan: usali.length + 1, className: "px-4 py-1.5 text-[10.5px] font-sans font-semibold uppercase tracking-wide text-[var(--accent-gold)] sticky left-0 bg-[var(--surface-2)]" }, row.section)
                    );
                  }
                  const highlightBg = row.highlight === "gold" ? "bg-[var(--accent-gold)]/[0.07]" : row.highlight === "emerald" ? "bg-[var(--accent-emerald)]/[0.07]" : "";
                  return React.createElement(
                    "tr",
                    { key: row.key, className: `border-b border-[var(--border)]/60 last:border-0 ${highlightBg}` },
                    React.createElement(
                      "td",
                      { className: `px-4 py-2 font-sans sticky left-0 ${row.highlight ? "bg-[var(--surface)] " + highlightBg : "bg-[var(--surface)]"} ${row.bold ? "font-semibold text-[var(--text)]" : "text-[var(--text-muted)]"} whitespace-nowrap` },
                      row.label
                    ),
                    usali.map((r) =>
                      React.createElement(
                        "td",
                        { key: r.year, className: `text-right px-3 py-2 tabular-nums ${row.bold ? "font-semibold text-[var(--text)]" : row.muted ? "text-[var(--text-muted)]" : "text-[var(--text)]/90"}` },
                        row.kind === "pct" ? Fmt.pct(r[row.key]) : Fmt.num0(r[row.key])
                      )
                    )
                  );
                })
              )
            )
          )
        ),

        // Notes d'analyse
        React.createElement(
          Card,
          { className: "p-5" },
          React.createElement("h3", { className: "font-serif text-base mb-3 flex items-center gap-2" }, React.createElement(Icon, { name: "fileText", size: 16, className: "text-[var(--accent-gold)]" }), "Notes d'analyse & commentaires d'exploitation"),
          React.createElement(Textarea, {
            value: p.notes,
            onChange: (e) => updateProject((proj) => ({ ...proj, notes: e.target.value })),
            placeholder: "Points de vigilance, hypothèses spécifiques, risques d'exploitation…",
            className: "min-h-[120px]",
          })
        )
      ),

      // ---- CompSet Flash sidebar ------------------------------------------
      React.createElement(
        Card,
        { className: "p-5 xl:sticky xl:top-6 h-fit" },
        React.createElement("h3", { className: "font-serif text-base mb-1 flex items-center gap-2" }, React.createElement(Icon, { name: "target", size: 16, className: "text-[var(--accent-gold)]" }), "CompSet Flash"),
        React.createElement("p", { className: "text-xs text-[var(--text-muted)] mb-3" }, "Benchmark instantané par ville depuis l'onglet CompSet."),
        React.createElement(Field, { label: "Ville de comparaison" }, React.createElement(TextInput, { value: compsetCity, onChange: (e) => setCompsetCity(e.target.value), placeholder: "ex. Paris" })),

        marketIndices
          ? React.createElement(
              "div",
              { className: "mt-4 space-y-3" },
              React.createElement("div", { className: "text-[11px] text-[var(--text-muted)]" }, marketIndices.count + " établissement(s) comparable(s)"),
              FlashRow("TO moyen marché", Fmt.pct(marketIndices.avgOcc), "TO projet " + Fmt.pct(p.params.occ)),
              FlashRow("ADR moyen marché", Fmt.num0(marketIndices.avgAdr) + " €", "ADR projet " + Fmt.num0(p.params.adr) + " €"),
              FlashRow("RevPAR moyen marché", Fmt.num0(marketIndices.avgRevpar) + " €", "RevPAR projet " + Fmt.num0(marketIndices.revpar) + " €"),
              React.createElement(
                "div",
                { className: "grid grid-cols-3 gap-2 pt-3 border-t border-[var(--border)]" },
                IndexBadge("MPI", marketIndices.mpi),
                IndexBadge("ARI", marketIndices.ari),
                IndexBadge("RGI", marketIndices.rgi)
              )
            )
          : React.createElement("div", { className: "mt-4 text-xs text-[var(--text-muted)] bg-[var(--surface-2)] rounded-lg p-3" }, "Aucune donnée CompSet pour cette ville. Importez des comparables dans l'onglet CompSet & Études de marché.")
      )
    )
  );

  function FlashRow(label, value, sub) {
    return React.createElement(
      "div",
      { className: "flex items-center justify-between text-sm" },
      React.createElement("span", { className: "text-[var(--text-muted)]" }, label),
      React.createElement(
        "div",
        { className: "text-right" },
        React.createElement("div", { className: "font-mono font-semibold" }, value),
        React.createElement("div", { className: "text-[10px] text-[var(--text-muted)]" }, sub)
      )
    );
  }

  function IndexBadge(label, value) {
    const tone = value == null ? "text-[var(--text-muted)]" : value >= 100 ? "text-[var(--accent-emerald)]" : "text-[var(--accent-red)]";
    return React.createElement(
      "div",
      { className: "flex flex-col items-center bg-[var(--surface-2)] rounded-lg py-2" },
      React.createElement("span", { className: "text-[10px] text-[var(--text-muted)] uppercase" }, label),
      React.createElement("span", { className: `font-mono font-semibold text-sm ${tone}` }, value != null ? value.toFixed(0) : "—")
    );
  }
};
