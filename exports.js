/* ============================================================================
   TAB 7 — EXPORTS & RAPPORTS : Excel complet, PDF bankable
   ============================================================================ */
window.App = window.App || {};
App.Tabs = App.Tabs || {};

App.Tabs.Exports = function ExportsTab() {
  const { useState, useMemo } = React;
  const { Card, Button, Fmt, SectionTitle, Icon, StatCard } = App.UI;
  const ctx = React.useContext(App.Ctx);
  const { currentProject: p, showToast } = ctx;
  const [busy, setBusy] = useState(null);

  const dcf = useMemo(() => App.Engine.computeDCF(p), [p]);
  const usali = useMemo(() => App.Engine.computeUSALI(p, 10), [p]);

  async function handleExcel() {
    setBusy("xlsx");
    try {
      await new Promise((r) => setTimeout(r, 50));
      App.Storage.exportXLSX(p);
      showToast("Export Excel généré.", "success");
    } catch (e) {
      showToast("Erreur export Excel : " + e.message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function handlePdf() {
    setBusy("pdf");
    try {
      await new Promise((r) => setTimeout(r, 50));
      App.Storage.exportPDF(p);
      showToast("Rapport PDF bankable généré.", "success");
    } catch (e) {
      showToast("Erreur export PDF : " + e.message, "error");
    } finally {
      setBusy(null);
    }
  }

  const checklistExcel = ["Récapitulatif du projet", "P&L USALI complet (10 ans)", "CompSet & indices de marché", "Projection de trésorerie & DSCR", "Tableau d'amortissement", "Analyse DCF & flux equity"];
  const checklistPdf = ["Page 1 — Executive Summary & KPIs clés", "Page 1 — Ratios bancaires (DSCR, LTC, taux, durée)", "Page 2 — Compte de résultat USALI synthétique", "Page 2 — Trésorerie & couverture de la dette"];

  return React.createElement(
    "div",
    { className: "space-y-6" },
    React.createElement(SectionTitle, { eyebrow: "Livrables", title: "Exports & Rapports" }),

    React.createElement(
      "div",
      { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
      React.createElement(StatCard, { icon: "building", label: "Projet", value: p.name, sub: p.city }),
      React.createElement(StatCard, { icon: "trendUp", label: "TRI equity", value: dcf.irr != null ? Fmt.pct(dcf.irr) : "n/d", tone: "gold" }),
      React.createElement(StatCard, { icon: "dollar", label: "VAN (NPV)", value: Fmt.num0(dcf.npv) + " €" }),
      React.createElement(StatCard, { icon: "barChart", label: "EBITDA stabilisé", value: Fmt.num0(usali[3] ? usali[3].ebitda : 0) + " €" })
    ),

    React.createElement(
      "div",
      { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },

      React.createElement(
        Card,
        { className: "p-6 flex flex-col" },
        React.createElement(
          "div",
          { className: "w-11 h-11 rounded-xl bg-[var(--accent-emerald)]/15 text-[var(--accent-emerald)] flex items-center justify-center mb-4" },
          React.createElement(Icon, { name: "fileSpreadsheet", size: 22 })
        ),
        React.createElement("h3", { className: "font-serif text-lg mb-1.5" }, "Export Excel complet"),
        React.createElement("p", { className: "text-sm text-[var(--text-muted)] mb-4" }, "Classeur .xlsx multi-feuilles prêt pour vos comités d'investissement, avec l'intégralité des données et calculs du projet."),
        React.createElement(
          "ul",
          { className: "space-y-1.5 mb-6 flex-1" },
          checklistExcel.map((c, i) =>
            React.createElement(
              "li",
              { key: i, className: "flex items-center gap-2 text-xs text-[var(--text-muted)]" },
              React.createElement(Icon, { name: "check", size: 13, className: "text-[var(--accent-emerald)] shrink-0" }),
              c
            )
          )
        ),
        React.createElement(Button, { variant: "emerald", icon: "download", onClick: handleExcel, disabled: busy === "xlsx" }, busy === "xlsx" ? "Génération…" : "Générer le fichier Excel (.xlsx)")
      ),

      React.createElement(
        Card,
        { className: "p-6 flex flex-col" },
        React.createElement(
          "div",
          { className: "w-11 h-11 rounded-xl bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] flex items-center justify-center mb-4" },
          React.createElement(Icon, { name: "fileText", size: 22 })
        ),
        React.createElement("h3", { className: "font-serif text-lg mb-1.5" }, "Rapport PDF « Bankable »"),
        React.createElement("p", { className: "text-sm text-[var(--text-muted)] mb-4" }, "Synthèse 2 pages prête à envoyer aux partenaires financiers : executive summary, P&L USALI et ratios bancaires."),
        React.createElement(
          "ul",
          { className: "space-y-1.5 mb-6 flex-1" },
          checklistPdf.map((c, i) =>
            React.createElement(
              "li",
              { key: i, className: "flex items-center gap-2 text-xs text-[var(--text-muted)]" },
              React.createElement(Icon, { name: "check", size: 13, className: "text-[var(--accent-gold)] shrink-0" }),
              c
            )
          )
        ),
        React.createElement(Button, { variant: "primary", icon: "download", onClick: handlePdf, disabled: busy === "pdf" }, busy === "pdf" ? "Génération…" : "Générer le rapport PDF")
      )
    ),

    React.createElement(
      Card,
      { className: "p-5 flex items-start gap-3" },
      React.createElement(Icon, { name: "info", size: 16, className: "text-[var(--text-muted)] mt-0.5 shrink-0" }),
      React.createElement(
        "p",
        { className: "text-xs text-[var(--text-muted)] leading-relaxed" },
        "Les exports reflètent l'état actuel du projet, y compris le scénario sélectionné dans l'onglet Valorisation & Scénarios. ",
        "Pensez à exporter régulièrement votre base complète (.json) depuis l'onglet Récapitulatif pour sécuriser vos données, qui sont uniquement stockées localement dans votre navigateur."
      )
    )
  );
};
