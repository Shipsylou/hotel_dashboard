/* ============================================================================
   APP.JS — Navigation, Router & Layout Master-Detail
   ============================================================================ */
window.App = window.App || {};

(function () {
  "use strict";
  const { useState, useEffect, useMemo, useCallback } = React;
  const { Icon, IconButton, Button, Badge } = App.UI;

  const NAV_ITEMS = [
    { id: "recap", label: "Vue Portefeuille", icon: "grid", scope: "portfolio" },
    { id: "fiche", label: "Fiche & Financement", icon: "fileText", scope: "project" },
    { id: "businessplan", label: "Business Plan (USALI)", icon: "table", scope: "project" },
    { id: "compset", label: "CompSet & Marché", icon: "barChart", scope: "project" },
    { id: "cashflow", label: "Cashflow & Dette", icon: "landmark", scope: "project" },
    { id: "valuation", label: "Valorisation & TRI", icon: "trendUp", scope: "project" },
    { id: "capex", label: "CAPEX & FF&E", icon: "calendar", scope: "project" },
    { id: "exports", label: "Exports Bankables", icon: "download", scope: "project" },
  ];

  const TAB_COMPONENTS = {
    recap: () => App.Tabs.Recap,
    fiche: () => App.Tabs.Fiche,
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

    const setState = useCallback((updater) => {
      setStateRaw((prev) => (typeof updater === "function" ? updater(prev) : updater));
    }, []);

    useEffect(() => { App.Storage.save(state); }, [state]);

    const currentProject = useMemo(() => state.projects.find((p) => p.id === state.activeProjectId) || null, [state.projects, state.activeProjectId]);

    const openProject = useCallback((id) => {
      setState((s) => ({ ...s, activeProjectId: id }));
      setActiveTab("fiche");
    }, [setState]);

    const updateProject = useCallback((updater) => {
      setState((s) => ({
        ...s,
        projects: s.projects.map((p) => (p.id !== s.activeProjectId ? p : typeof updater === "function" ? updater(p) : { ...p, ...updater })),
      }));
    }, [setState]);

    const ctxValue = useMemo(() => ({ state, setState, currentProject, updateProject, openProject, activeTab, setActiveTab }), [state, currentProject, updateProject, openProject, activeTab]);

    const ActiveComponent = TAB_COMPONENTS[activeTab] ? TAB_COMPONENTS[activeTab]() : App.Tabs.Recap;

    return React.createElement(
      App.Ctx.Provider,
      { value: ctxValue },
      React.createElement(
        "div",
        { className: "min-h-screen flex bg-[var(--bg)] text-[var(--text)]" },
        React.createElement(
          "aside",
          { className: "w-64 bg-[var(--surface)] border-r border-[var(--border)] p-4 flex flex-col gap-4" },
          React.createElement("div", { className: "font-serif text-lg font-bold text-[var(--accent-gold)]" }, "Hotel Asset Mgt"),
          React.createElement(
            "nav",
            { className: "space-y-1 flex-1" },
            NAV_ITEMS.map((item) => {
              const disabled = item.scope === "project" && !currentProject;
              return React.createElement(
                "button",
                {
                  key: item.id,
                  disabled,
                  onClick: () => setActiveTab(item.id),
                  className: `w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                    activeTab === item.id ? "bg-[var(--accent-gold)] text-[#1a1204] font-bold" : disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-[var(--surface-2)]"
                  }`,
                },
                React.createElement(Icon, { name: item.icon, size: 14 }),
                item.label
              );
            })
          )
        ),
        React.createElement("main", { className: "flex-1 p-8 overflow-y-auto" }, React.createElement(ActiveComponent))
      )
    );
  }

  App.Root = Root;
})();

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App.Root));
