/* ============================================================================
   TAB 1 — RÉCAPITULATIF & PORTEFEUILLE CONSOLIDÉ
   ============================================================================ */
window.App = window.App || {};
App.Tabs = App.Tabs || {};

App.Tabs.Recap = function Recap() {
  const { useState, useMemo, useRef } = React;
  const { Card, Badge, Button, IconButton, Icon, ConfirmDialog, TextInput, Select, Fmt, EmptyState, SectionTitle, StatCard } = App.UI;
  const ctx = React.useContext(App.Ctx);
  const { state, setState, showToast, openProject } = ctx;

  const [activeSubTab, setActiveSubTab] = useState("portfolio"); // portfolio | consolidated
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileInputRef = useRef(null);

  const projects = state.projects;
  const portfolioStats = useMemo(() => App.Engine.computePortfolioConsolidated(projects), [projects]);

  const filtered = useMemo(() => {
    let list = projects.filter((p) => {
      const matchesQuery = !query || (p.name + " " + p.city).toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "Tous" || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
    return list.sort((a, b) => (b.favorite === a.favorite ? new Date(b.updatedAt) - new Date(a.updatedAt) : b.favorite - a.favorite));
  }, [projects, query, statusFilter]);

  function loadDemo() {
    const demo = App.Data.demoProject();
    setState((s) => ({ ...s, projects: [...s.projects, demo], activeProjectId: demo.id }));
    showToast("Projet démo « Hôtel Station Alpes Top 10 » chargé.", "success");
  }

  return React.createElement(
    "div",
    { className: "space-y-6" },
    React.createElement(SectionTitle, {
      eyebrow: "Asset Management",
      title: "Tableau de Bord Portefeuille & Consolidation",
      right: React.createElement(
        "div",
        { className: "flex flex-wrap items-center gap-2" },
        React.createElement(Button, { variant: "secondary", size: "sm", icon: "layers", onClick: loadDemo }, "Charger cas démo (Station Alpes)"),
        React.createElement(Button, { variant: "primary", size: "sm", icon: "plus", onClick: () => setState((s) => ({ ...s, activeProjectId: null })) }, "Nouveau projet")
      ),
    }),

    // KPIs Consolidés du Portefeuille
    portfolioStats &&
      React.createElement(
        "div",
        { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3" },
        React.createElement(StatCard, { label: "Projets étudiés", value: portfolioStats.studiedCount }),
        React.createElement(StatCard, { label: "Taux Conversion", value: portfolioStats.conversionRate.toFixed(0) + " %" }),
        React.createElement(StatCard, { label: "Hôtels Exploitation", value: portfolioStats.exploitationCount }),
        React.createElement(StatCard, { label: "PM HT Moyen", value: Fmt.num0(portfolioStats.avgWeightedAdr) + " €" }),
        React.createElement(StatCard, { label: "TO Moyen", value: Fmt.pct(portfolioStats.avgWeightedOcc) }),
        React.createElement(StatCard, { label: "CA Consolidé", value: Fmt.num0(portfolioStats.totalCaConsolidated) + " €", tone: "gold" }),
        React.createElement(StatCard, { label: "Equity Investie", value: Fmt.num0(portfolioStats.totalEquityInvested) + " €" }),
        React.createElement(StatCard, { label: "TRI Moyen", value: portfolioStats.avgPortfolioIrr != null ? Fmt.pct(portfolioStats.avgPortfolioIrr) : "—", tone: "emerald" })
      ),

    // Sous-navigation : Liste vs Consolidé
    React.createElement(
      "div",
      { className: "flex gap-2 border-b border-[var(--border)] pb-2" },
      React.createElement(Button, { variant: activeSubTab === "portfolio" ? "primary" : "ghost", size: "sm", onClick: () => setActiveSubTab("portfolio") }, "Projets du portefeuille"),
      React.createElement(Button, { variant: activeSubTab === "consolidated" ? "primary" : "ghost", size: "sm", onClick: () => setActiveSubTab("consolidated") }, "Vue Consolidée (P&L Consolidé)")
    ),

    activeSubTab === "portfolio"
      ? React.createElement(
          "div",
          { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
          filtered.map((p) =>
            React.createElement(
              Card,
              { key: p.id, className: "p-5 space-y-3 cursor-pointer hover:border-[var(--accent-gold)] transition-colors", onClick: () => openProject(p.id) },
              React.createElement("div", { className: "font-serif text-base font-bold truncate" }, p.name),
              React.createElement("div", { className: "text-xs text-[var(--text-muted)]" }, p.city + " • " + p.keys + " clés • " + p.projectType),
              React.createElement(Badge, { tone: App.Data.STATUS_COLORS[p.status] || "slate" }, p.status)
            )
          )
        )
      : React.createElement(
          Card,
          { className: "p-5" },
          React.createElement("h3", { className: "font-serif text-base mb-3" }, "Somme dynamique des P&L USALI du portefeuille"),
          React.createElement("p", { className: "text-xs text-[var(--text-muted)]" }, "Consolidation brute de l'ensemble des chiffres d'affaires et EBITDA des " + projects.length + " projets enregistrés.")
        )
  );
};
