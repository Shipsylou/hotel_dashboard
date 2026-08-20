/* ============================================================================
   TAB — FICHE IDENTITÉ, CAP TABLE & PLAN DE FINANCEMENT
   ============================================================================ */
window.App = window.App || {};
App.Tabs = App.Tabs || {};

App.Tabs.Fiche = function FicheTab() {
  const { Card, Field, TextInput, NumberInput, Select, Fmt, SectionTitle, Icon, StatCard, Badge } = React;
  const ctx = React.useContext(App.Ctx);
  const { currentProject: p, updateProject } = ctx;

  const uses = App.Engine.computeUsesAndSources(p);

  function patchIdentity(key, value) {
    updateProject((proj) => ({ ...proj, identity: { ...proj.identity, [key]: value } }));
  }

  function patchUses(key, value) {
    updateProject((proj) => ({ ...proj, usesSources: { ...proj.usesSources, [key]: value } }));
  }

  function patchFinancing(debtType, key, value) {
    updateProject((proj) => ({
      ...proj,
      financing: {
        ...proj.financing,
        [debtType]: { ...proj.financing[debtType], [key]: value },
      },
    }));
  }

  return React.createElement(
    "div",
    { className: "space-y-6" },
    React.createElement(SectionTitle, { eyebrow: "Ingénierie de Deal", title: "Fiche Identité & Plan de Financement (Emplois / Ressources)" }),

    // KPIs synthétiques
    React.createElement(
      "div",
      { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
      React.createElement(StatCard, { icon: "building", label: "Prix Acquisition / Clé", value: Fmt.num0(uses.pricePerKey) + " €", sub: p.keys + " clés" }),
      React.createElement(StatCard, { icon: "landmark", label: "Prix de Revient Total / Clé", value: Fmt.num0(uses.totalCostPerKey) + " €", tone: "gold" }),
      React.createElement(StatCard, { icon: "pieChart", label: "Equity / Fonds Propres", value: Fmt.num0(uses.equityCalculated) + " €" }),
      React.createElement(StatCard, { icon: "scale", label: "Dette Totale à Lever", value: Fmt.num0(uses.totalDette) + " €" })
    ),

    // Module 0 : Fiche Identité
    React.createElement(
      App.UI.Card,
      { className: "p-5" },
      React.createElement("h3", { className: "font-serif text-base mb-4 flex items-center gap-2" }, React.createElement(App.UI.Icon, { name: "fileText", size: 16, className: "text-[var(--accent-gold)]" }), "0/ FICHE IDENTITÉ DU DEAL"),
      React.createElement(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement(App.UI.Field, { label: "Type d'établissement" }, React.createElement(App.UI.TextInput, { value: p.identity.erpType, onChange: (e) => patchIdentity("erpType", e.target.value) })),
        React.createElement(App.UI.Field, { label: "Enseigne / Marque" }, React.createElement(App.UI.TextInput, { value: p.identity.brand, onChange: (e) => patchIdentity("brand", e.target.value) })),
        React.createElement(App.UI.Field, { label: "Surface (m²)" }, React.createElement(App.UI.NumberInput, { value: p.identity.surface, onChange: (e) => patchIdentity("surface", Number(e.target.value)) })),
        React.createElement(App.UI.Field, { label: "Autorisation Urbanisme" }, React.createElement(App.UI.TextInput, { value: p.identity.authorization, onChange: (e) => patchIdentity("authorization", e.target.value) })),
        React.createElement(App.UI.Field, { label: "Effectifs (ETP)" }, React.createElement(App.UI.NumberInput, { value: p.identity.etp, onChange: (e) => patchIdentity("etp", Number(e.target.value)) })),
        React.createElement(App.UI.Field, { label: "Broker / Conseil" }, React.createElement(App.UI.TextInput, { value: p.identity.broker, onChange: (e) => patchIdentity("broker", e.target.value) })),
        React.createElement(App.UI.Field, { label: "Prix Demande (Murs/Fonds)" }, React.createElement(App.UI.NumberInput, { suffix: "€", value: p.identity.askingPrice, onChange: (e) => patchIdentity("askingPrice", Number(e.target.value)) })),
        React.createElement(App.UI.Field, { label: "Prix Propose" }, React.createElement(App.UI.NumberInput, { suffix: "€", value: p.identity.proposedPrice, onChange: (e) => patchIdentity("proposedPrice", Number(e.target.value)) })),
        React.createElement(App.UI.Field, { label: "Date cible d'acquisition" }, React.createElement(App.UI.TextInput, { value: p.identity.targetAcquisitionDate, onChange: (e) => patchIdentity("targetAcquisitionDate", e.target.value) }))
      )
    ),

    // Module 2 : Plan de Financement (Emplois & Ressources)
    React.createElement(
      App.UI.Card,
      { className: "p-5" },
      React.createElement("h3", { className: "font-serif text-base mb-4 flex items-center gap-2" }, React.createElement(App.UI.Icon, { name: "landmark", size: 16, className: "text-[var(--accent-gold)]" }), "2/ PLAN DE FINANCEMENT (EMPLOIS & RESSOURCES)"),
      React.createElement(
        "div",
        { className: "grid grid-cols-1 lg:grid-cols-2 gap-8" },

        // Colonne EMPLOIS
        React.createElement(
          "div",
          { className: "space-y-3" },
          React.createElement("h4", { className: "text-xs font-semibold uppercase tracking-wide text-[var(--accent-gold)] border-b border-[var(--border)] pb-1" }, "EMPLOIS (Besoins)"),
          RowInput("Acquisition Murs / Asset", p.usesSources.assetPrice, (v) => patchUses("assetPrice", v), "€"),
          RowInput("Licence 4", p.usesSources.licencePrice, (v) => patchUses("licencePrice", v), "€"),
          RowInput("Droits d'acquisition (%)", (p.usesSources.droitsAcqPct || 0) * 100, (v) => patchUses("droitsAcqPct", v / 100), "%"),
          RowInput("Honoraires Broker HT", p.usesSources.brokerFeeHt, (v) => patchUses("brokerFeeHt", v), "€"),
          RowInput("Frais Avocats / Notaire", p.usesSources.lawyersFee, (v) => patchUses("lawyersFee", v), "€"),
          RowInput("Frais de Structuring / SH (%)", (p.usesSources.shFeePct || 0) * 100, (v) => patchUses("shFeePct", v / 100), "%"),
          RowInput("Travaux CAPEX HT", p.usesSources.capexTravauxHt, (v) => patchUses("capexTravauxHt", v), "€"),
          RowInput("Financement FF&E HT", p.usesSources.ffeHt, (v) => patchUses("ffeHt", v), "€"),
          RowInput("AMO Travaux (%)", (p.usesSources.amoTravauxPct || 0) * 100, (v) => patchUses("amoTravauxPct", v / 100), "%"),
          React.createElement(
            "div",
            { className: "flex justify-between items-center font-bold text-sm pt-2 border-t border-[var(--border)]" },
            React.createElement("span", null, "TOTAL EMPLOIS"),
            React.createElement("span", { className: "font-mono" }, Fmt.num0(uses.totalEmplois) + " €")
          )
        ),

        // Colonne RESSOURCES
        React.createElement(
          "div",
          { className: "space-y-3" },
          React.createElement("h4", { className: "text-xs font-semibold uppercase tracking-wide text-[var(--accent-emerald)] border-b border-[var(--border)] pb-1" }, "RESSOURCES (Financements)"),
          RowInput("Dette Acquisition (€)", p.financing?.detteAcquisition?.amount || 0, (v) => patchFinancing("detteAcquisition", "amount", v), "€"),
          RowInput("Dette Travaux (€)", p.financing?.detteTravaux?.amount || 0, (v) => patchFinancing("detteTravaux", "amount", v), "€"),
          React.createElement(
            "div",
            { className: "p-3 rounded-lg bg-[var(--surface-2)] flex justify-between items-center" },
            React.createElement("span", { className: "text-xs font-medium text-[var(--text-muted)]" }, "Equity sponsor requis (solde équilibre)"),
            React.createElement("span", { className: "font-mono font-bold text-sm text-[var(--accent-gold)]" }, Fmt.num0(uses.equityCalculated) + " €")
          ),
          React.createElement(
            "div",
            { className: "flex justify-between items-center font-bold text-sm pt-2 border-t border-[var(--border)]" },
            React.createElement("span", null, "TOTAL RESSOURCES"),
            React.createElement("span", { className: "font-mono" }, Fmt.num0(uses.totalRessources) + " €")
          ),
          React.createElement(
            "div",
            { className: "mt-4 p-3 rounded-lg border flex items-center justify-between " + (uses.balance === 0 ? "border-[var(--accent-emerald)]/40 bg-[var(--accent-emerald)]/10" : "border-[var(--accent-red)]/40 bg-[var(--accent-red)]/10") },
            React.createElement("span", { className: "text-xs font-semibold" }, "Équilibre Emplois - Ressources"),
            React.createElement("span", { className: "font-mono font-bold text-xs" }, uses.balance === 0 ? "✓ Équilibré (0 €)" : Fmt.num0(uses.balance) + " €")
          )
        )
      )
    )
  );

  function RowInput(label, value, onChange, suffix) {
    return React.createElement(
      "div",
      { className: "flex items-center justify-between text-xs gap-2" },
      React.createElement("span", { className: "text-[var(--text-muted)]" }, label),
      React.createElement(App.UI.NumberInput, { value, onChange: (e) => onChange(Number(e.target.value)), suffix, className: "w-36 text-right font-mono" })
    );
  }
};
