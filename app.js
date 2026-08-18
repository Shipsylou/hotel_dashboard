/* ============================================================================
   APP.JS — Composant racine : navigation, état global, persistance, thème
   ============================================================================ */
window.App = window.App || {};

(function () {
  "use strict";
  const { useState, useEffect, useMemo, useCallback } = React;
  const { Icon, IconButton, Button, Badge, Toast } = App.UI;

  const NAV_ITEMS = [
    { id: "recap", label: "Récapitulatif", icon: "grid", scope: "portfolio" },
    { id: "businessplan", label: "Business Plan (USALI)", icon: "table", scope: "project" },
    { id: "compset", label: "CompSet & Marché", icon: "barChart", scope: "project" },
    { id: "cashflow", label: "Cashflow & Financement", icon: "landmark", scope: "project" },
    { id: "valuation", label: "Valorisation & Scénarios", icon: "trendUp", scope: "project" },
    { id: "capex", label: "CAPEX & FF&E", icon: "calendar", scope: "project" },
    { id: "exports", label: "Exports & Rapports", icon: "fileText", scope: "project" },
  ];

  const TAB_COMPONENTS = {
    recap: () => App.Tabs.Recap,
    businessplan: () => App.Tabs.BusinessPlan,
    compset: () => App.Tabs.CompSet,
    cashflow: () => App.Tabs.Cashflow,
    valuation: () => App.Tabs.Valuation,
    capex: () => App.Tabs.Capex,
    exports: () => App.Tabs.Exports,
  };

  function Root() {
    const [state, setStateRaw] = useState(() => App.Storage.load());
    const [activeTab, setActiveTab] = useState("recap");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [toasts, setToasts] = useState([]);

    // setState accepte soit un objet, soit une fonction updater (comme useState)
    const setState = useCallback((updater) => {
      setStateRaw((prev) => (typeof updater === "function" ? updater(prev) : updater));
    }, []);

    // Persistance automatique
    useEffect(() => {
      App.Storage.save(state);
    }, [state]);

    // Application du thème sur <html>
    useEffect(() => {
      const root = document.documentElement;
      root.classList.remove("dark", "light");
      root.classList.add(state.theme === "light" ? "light" : "dark");
    }, [state.theme]);

    const currentProject = useMemo(() => state.projects.find((p) => p.id === state.activeProjectId) || null, [state.projects, state.activeProjectId]);

    // Repli automatique vers le Récapitulatif si un onglet "projet" est actif sans projet sélectionné
    useEffect(() => {
      const item = NAV_ITEMS.find((n) => n.id === activeTab);
      if (item && item.scope === "project" && !currentProject) {
        setActiveTab("recap");
      }
    }, [currentProject, activeTab]);

    const showToast = useCallback((message, type) => {
      const id = App.Data.uid("toast");
      setToasts((t) => [...t, { id, message, type: type || "info" }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
    }, []);
    const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

    const openProject = useCallback((id) => {
      setState((s) => ({ ...s, activeProjectId: id }));
      setActiveTab("businessplan");
      setSidebarOpen(false);
    }, [setState]);

    // Met à jour le projet courant (patch objet ou fonction updater)
    const updateProject = useCallback(
      (updater) => {
        setState((s) => ({
          ...s,
          projects: s.projects.map((p) => {
            if (p.id !== s.activeProjectId) return p;
            const next = typeof updater === "function" ? updater(p) : { ...p, ...updater };
            return { ...next, updatedAt: new Date().toISOString() };
          }),
        }));
      },
      [setState]
    );

    const toggleTheme = useCallback(() => {
      setState((s) => ({ ...s, theme: s.theme === "light" ? "dark" : "light" }));
    }, [setState]);

    const ctxValue = useMemo(
      () => ({ state, setState, currentProject, updateProject, showToast, openProject, activeTab, setActiveTab, theme: state.theme, toggleTheme }),
      [state, currentProject, updateProject, showToast, openProject, activeTab, toggleTheme]
    );

    const ActiveComponent = TAB_COMPONENTS[activeTab] ? TAB_COMPONENTS[activeTab]() : App.Tabs.Recap;
    const needsProject = (NAV_ITEMS.find((n) => n.id === activeTab) || {}).scope === "project";

    return React.createElement(
      App.Ctx.Provider,
      { value: ctxValue },
      React.createElement(
        "div",
        { className: "min-h-screen flex bg-[var(--bg)] text-[var(--text)]" },

        // ---- Sidebar ---------------------------------------------------------
        React.createElement(
          "aside",
          {
            className: `fixed lg:sticky top-0 z-40 h-screen w-72 shrink-0 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col transition-transform duration-200 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            }`,
          },
          React.createElement(
            "div",
            { className: "px-5 py-5 border-b border-[var(--border)] flex items-center gap-3" },
            React.createElement(
              "div",
              { className: "w-9 h-9 rounded-lg bg-[var(--accent-gold)] flex items-center justify-center text-[#1a1204] shrink-0" },
              React.createElement(Icon, { name: "landmark", size: 18 })
            ),
            React.createElement(
              "div",
              { className: "min-w-0" },
              React.createElement("div", { className: "font-serif text-[15px] leading-tight text-[var(--text)]" }, "Hotel Feasibility"),
              React.createElement("div", { className: "text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]" }, "Investment Dashboard")
            ),
            React.createElement(IconButton, { name: "x", className: "lg:hidden ml-auto", onClick: () => setSidebarOpen(false) })
          ),

          currentProject &&
            React.createElement(
              "div",
              { className: "mx-4 mt-4 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]" },
              React.createElement("div", { className: "text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-1" }, "Projet actif"),
              React.createElement("div", { className: "font-serif text-sm truncate", title: currentProject.name }, currentProject.name),
              React.createElement(
                "div",
                { className: "flex items-center gap-1.5 mt-1.5" },
                React.createElement(Badge, { tone: App.Data.STATUS_COLORS[currentProject.status] || "slate" }, currentProject.status),
                React.createElement("span", { className: "text-[11px] text-[var(--text-muted)]" }, currentProject.city)
              )
            ),

          React.createElement(
            "nav",
            { className: "flex-1 overflow-y-auto px-3 py-4 space-y-1" },
            NAV_ITEMS.map((item) => {
              const disabled = item.scope === "project" && !currentProject;
              const active = activeTab === item.id;
              return React.createElement(
                "button",
                {
                  key: item.id,
                  disabled,
                  title: disabled ? "Sélectionnez d'abord un projet" : undefined,
                  onClick: () => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  },
                  className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    active
                      ? "bg-[var(--accent-gold)]/12 text-[var(--accent-gold)] font-medium"
                      : disabled
                      ? "text-[var(--text-muted)]/40 cursor-not-allowed"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                  }`,
                },
                React.createElement(Icon, { name: item.icon, size: 16, className: "shrink-0" }),
                React.createElement("span", { className: "truncate" }, item.label)
              );
            })
          ),

          React.createElement(
            "div",
            { className: "p-4 border-t border-[var(--border)] flex items-center justify-between" },
            React.createElement(
              "button",
              { onClick: toggleTheme, className: "flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors" },
              React.createElement(Icon, { name: state.theme === "light" ? "moon" : "sun", size: 15 }),
              state.theme === "light" ? "Mode sombre" : "Mode clair"
            ),
            React.createElement("span", { className: "text-[10px] text-[var(--text-muted)]" }, state.projects.length + " projet(s)")
          )
        ),

        sidebarOpen && React.createElement("div", { className: "fixed inset-0 bg-black/50 z-30 lg:hidden", onClick: () => setSidebarOpen(false) }),

        // ---- Contenu principal -------------------------------------------------
        React.createElement(
          "div",
          { className: "flex-1 min-w-0 flex flex-col" },
          React.createElement(
            "header",
            { className: "lg:hidden sticky top-0 z-20 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--border)] px-4 py-3 flex items-center gap-3" },
            React.createElement(IconButton, { name: "menu", onClick: () => setSidebarOpen(true) }),
            React.createElement("span", { className: "font-serif text-sm" }, "Hotel Feasibility")
          ),
          React.createElement(
            "main",
            { className: "flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-[1400px] w-full mx-auto" },
            needsProject && !currentProject
              ? React.createElement(App.UI.EmptyState, {
                  icon: "building",
                  title: "Sélectionnez un projet",
                  message: "Choisissez un projet depuis le Récapitulatif pour accéder à ses données financières.",
                  action: React.createElement(Button, { variant: "primary", onClick: () => setActiveTab("recap") }, "Retour au récapitulatif"),
                })
              : React.createElement(ActiveComponent)
          )
        )
      ),
      React.createElement(Toast, { toasts, dismiss: dismissToast })
    );
  }

  App.Root = Root;
})();

// ---- Montage de l'application -----------------------------------------------
const rootEl = document.getElementById("root");
ReactDOM.createRoot(rootEl).render(React.createElement(App.Root));
