/* ============================================================================
   TAB 1 — RÉCAPITULATIF : liste des projets, CRUD, favoris, sauvegarde
   ============================================================================ */
window.App = window.App || {};
App.Tabs = App.Tabs || {};

App.Tabs.Recap = function Recap() {
  const { useState, useMemo, useRef } = React;
  const { Card, Badge, Button, IconButton, Icon, ConfirmDialog, TextInput, Select, Fmt, EmptyState, SectionTitle } = App.UI;
  const ctx = React.useContext(App.Ctx);
  const { state, setState, showToast, openProject } = ctx;

  const [view, setView] = useState(state.view || "cards");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [modalProject, setModalProject] = useState(null); // objet en édition (ou null)
  const [confirmDelete, setConfirmDelete] = useState(null); // id à supprimer
  const fileInputRef = useRef(null);

  const projects = state.projects;

  const filtered = useMemo(() => {
    let list = projects.filter((p) => {
      const matchesQuery = !query || (p.name + " " + p.city).toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "Tous" || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
    list = list.slice().sort((a, b) => (b.favorite === a.favorite ? new Date(b.updatedAt) - new Date(a.updatedAt) : b.favorite - a.favorite));
    return list;
  }, [projects, query, statusFilter]);

  function updateProjects(next) {
    setState((s) => ({ ...s, projects: next }));
  }

  function toggleFavorite(id) {
    updateProjects(projects.map((p) => (p.id === id ? { ...p, favorite: !p.favorite, updatedAt: new Date().toISOString() } : p)));
  }

  function deleteProject(id) {
    updateProjects(projects.filter((p) => p.id !== id));
    if (state.activeProjectId === id) setState((s) => ({ ...s, activeProjectId: null }));
    showToast("Projet supprimé.", "success");
  }

  function saveModalProject(proj) {
    const exists = projects.some((p) => p.id === proj.id);
    const stamped = { ...proj, updatedAt: new Date().toISOString() };
    updateProjects(exists ? projects.map((p) => (p.id === proj.id ? stamped : p)) : [...projects, stamped]);
    setModalProject(null);
    showToast(exists ? "Projet mis à jour." : "Projet créé.", "success");
  }

  function loadDemo() {
    const demo = App.Data.demoProject();
    updateProjects([...projects, demo]);
    setState((s) => ({ ...s, activeProjectId: demo.id }));
    showToast("Projet démo « Boutique Hôtel Paris » chargé.", "success");
  }

  function handleExport() {
    App.Storage.exportJSON(state);
    showToast("Sauvegarde exportée.", "success");
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    App.Storage.importJSON(
      file,
      (imported) => {
        setState(imported);
        showToast("Sauvegarde restaurée avec succès.", "success");
      },
      (err) => showToast("Échec de l'import : " + err.message, "error")
    );
    e.target.value = "";
  }

  function computeCardMetrics(p) {
    try {
      const usali = App.Engine.computeUSALI(p, 4);
      const dcf = App.Engine.computeDCF(p);
      const stab = usali[usali.length - 1];
      return { revpar: stab.revpar, tri: dcf.irr };
    } catch (e) {
      return { revpar: null, tri: null };
    }
  }

  return React.createElement(
    "div",
    { className: "space-y-6" },
    React.createElement(
      SectionTitle,
      {
        eyebrow: "Portefeuille",
        title: "Récapitulatif des projets",
        right: React.createElement(
          "div",
          { className: "flex flex-wrap items-center gap-2" },
          React.createElement(Button, { variant: "secondary", size: "sm", icon: "upload", onClick: () => fileInputRef.current.click() }, "Importer une sauvegarde"),
          React.createElement("input", { ref: fileInputRef, type: "file", accept: "application/json", className: "hidden", onChange: handleImportFile }),
          React.createElement(Button, { variant: "secondary", size: "sm", icon: "download", onClick: handleExport }, "Exporter la base (.json)"),
          React.createElement(Button, { variant: "secondary", size: "sm", icon: "layers", onClick: loadDemo }, "Charger un projet démo"),
          React.createElement(Button, { variant: "primary", size: "sm", icon: "plus", onClick: () => setModalProject(App.Data.newProject()) }, "Ajouter un projet")
        ),
      }
    ),

    // Barre de filtres
    React.createElement(
      "div",
      { className: "flex flex-wrap items-center gap-3" },
      React.createElement(
        "div",
        { className: "relative flex-1 min-w-[220px] max-w-sm" },
        React.createElement(Icon, { name: "search", size: 15, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" }),
        React.createElement(TextInput, { placeholder: "Rechercher un hôtel, une ville…", value: query, onChange: (e) => setQuery(e.target.value), className: "pl-9" })
      ),
      React.createElement(Select, {
        options: ["Tous", ...App.Data.STATUS_OPTIONS],
        value: statusFilter,
        onChange: (e) => setStatusFilter(e.target.value),
        className: "w-auto",
      }),
      React.createElement(
        "div",
        { className: "ml-auto flex items-center gap-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-1" },
        React.createElement(IconButton, { name: "grid", title: "Vue cartes", onClick: () => setView("cards"), className: view === "cards" ? "bg-[var(--surface)] text-[var(--accent-gold)]" : "" }),
        React.createElement(IconButton, { name: "table", title: "Vue tableau", onClick: () => setView("table"), className: view === "table" ? "bg-[var(--surface)] text-[var(--accent-gold)]" : "" })
      )
    ),

    filtered.length === 0
      ? React.createElement(EmptyState, {
          icon: "building",
          title: "Aucun projet pour le moment",
          message: "Ajoutez votre premier projet hôtelier ou chargez un exemple pré-rempli pour explorer le dashboard.",
          action: React.createElement(
            "div",
            { className: "flex gap-2" },
            React.createElement(Button, { variant: "primary", icon: "plus", onClick: () => setModalProject(App.Data.newProject()) }, "Ajouter un projet"),
            React.createElement(Button, { variant: "secondary", icon: "layers", onClick: loadDemo }, "Charger la démo")
          ),
        })
      : view === "cards"
      ? React.createElement(
          "div",
          { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" },
          filtered.map((p) => ProjectCard(p))
        )
      : ProjectTable(filtered),

    modalProject ? React.createElement(ProjectEditModal, { key: modalProject.id, project: modalProject, isNew: !projects.some((pr) => pr.id === modalProject.id), onClose: () => setModalProject(null), onSave: saveModalProject }) : null,
    React.createElement(ConfirmDialog, {
      open: !!confirmDelete,
      onClose: () => setConfirmDelete(null),
      onConfirm: () => deleteProject(confirmDelete),
      title: "Supprimer ce projet ?",
      message: "Cette action est irréversible. Toutes les données (P&L, CompSet, financement) associées à ce projet seront définitivement supprimées.",
      confirmLabel: "Supprimer",
    })
  );

  function ProjectCard(p) {
    const m = computeCardMetrics(p);
    const tone = App.Data.STATUS_COLORS[p.status] || "slate";
    return React.createElement(
      Card,
      { key: p.id, className: "p-5 flex flex-col gap-3 hover:border-[var(--accent-gold)]/40 transition-colors group" },
      React.createElement(
        "div",
        { className: "flex items-start justify-between gap-2" },
        React.createElement(
          "div",
          { className: "min-w-0" },
          React.createElement("h3", { className: "font-serif text-base text-[var(--text)] leading-snug truncate", title: p.name }, p.name || "Sans nom"),
          React.createElement(
            "div",
            { className: "flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-1" },
            React.createElement(Icon, { name: "mapPin", size: 12 }),
            p.city || "Ville non renseignée"
          )
        ),
        React.createElement(IconButton, {
          name: "star", title: "Favori",
          onClick: () => toggleFavorite(p.id),
          className: p.favorite ? "text-[var(--accent-gold)]" : "",
          style: p.favorite ? { fill: "var(--accent-gold)" } : {},
        })
      ),
      React.createElement(
        "div",
        { className: "flex items-center gap-2 flex-wrap" },
        React.createElement(Badge, { tone }, p.status),
        React.createElement(Badge, { tone: "slate" }, p.category)
      ),
      React.createElement(
        "div",
        { className: "grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)]" },
        MiniStat("Clés", Fmt.int(p.keys)),
        MiniStat("RevPAR", m.revpar != null ? Fmt.num0(m.revpar) + " €" : "—"),
        MiniStat("TRI", m.tri != null ? Fmt.pct(m.tri) : "—")
      ),
      React.createElement(
        "div",
        { className: "flex items-center gap-2 pt-1" },
        React.createElement(Button, { variant: "secondary", size: "sm", className: "flex-1", onClick: () => openProject(p.id) }, "Ouvrir"),
        React.createElement(IconButton, { name: "edit", title: "Modifier", onClick: () => setModalProject(p) }),
        React.createElement(IconButton, { name: "trash", title: "Supprimer", onClick: () => setConfirmDelete(p.id), className: "hover:text-[var(--accent-red)]" })
      )
    );
  }

  function MiniStat(label, value) {
    return React.createElement(
      "div",
      { className: "flex flex-col" },
      React.createElement("span", { className: "text-[10px] uppercase tracking-wide text-[var(--text-muted)]" }, label),
      React.createElement("span", { className: "font-mono text-sm font-semibold tabular-nums text-[var(--text)]" }, value)
    );
  }

  function ProjectTable(list) {
    return React.createElement(
      Card,
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
            ["", "Projet", "Ville", "Catégorie", "Clés", "Statut", "RevPAR", "TRI", ""].map((h, i) =>
              React.createElement("th", { key: i, className: "px-4 py-3 font-medium" }, h)
            )
          )
        ),
        React.createElement(
          "tbody",
          null,
          list.map((p) => {
            const m = computeCardMetrics(p);
            const tone = App.Data.STATUS_COLORS[p.status] || "slate";
            return React.createElement(
              "tr",
              { key: p.id, className: "border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/50" },
              React.createElement(
                "td",
                { className: "px-4 py-3" },
                React.createElement(IconButton, { name: "star", size: 15, onClick: () => toggleFavorite(p.id), className: p.favorite ? "text-[var(--accent-gold)]" : "" })
              ),
              React.createElement("td", { className: "px-4 py-3 font-medium text-[var(--text)] cursor-pointer", onClick: () => openProject(p.id) }, p.name),
              React.createElement("td", { className: "px-4 py-3 text-[var(--text-muted)]" }, p.city),
              React.createElement("td", { className: "px-4 py-3 text-[var(--text-muted)]" }, p.category),
              React.createElement("td", { className: "px-4 py-3 font-mono tabular-nums" }, Fmt.int(p.keys)),
              React.createElement("td", { className: "px-4 py-3" }, React.createElement(Badge, { tone }, p.status)),
              React.createElement("td", { className: "px-4 py-3 font-mono tabular-nums" }, m.revpar != null ? Fmt.num0(m.revpar) + " €" : "—"),
              React.createElement("td", { className: "px-4 py-3 font-mono tabular-nums" }, m.tri != null ? Fmt.pct(m.tri) : "—"),
              React.createElement(
                "td",
                { className: "px-4 py-3" },
                React.createElement(
                  "div",
                  { className: "flex items-center gap-1 justify-end" },
                  React.createElement(IconButton, { name: "edit", size: 15, onClick: () => setModalProject(p) }),
                  React.createElement(IconButton, { name: "trash", size: 15, onClick: () => setConfirmDelete(p.id), className: "hover:text-[var(--accent-red)]" })
                )
              )
            );
          })
        )
      )
    );
  }
};

/* Modale d'ajout/édition — composant top-level (et non une fonction imbriquée)
   afin de respecter les Rules of Hooks : son état interne (useState) doit
   appartenir à une instance de composant React dédiée, indépendante du rendu
   conditionnel du composant parent. */
function ProjectEditModal({ project, isNew, onClose, onSave }) {
  const { useState } = React;
  const { Modal, Button, Field, TextInput, NumberInput, Select } = App.UI;
  const [form, setForm] = useState(project);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const setNum = (k) => (e) => setForm({ ...form, [k]: e.target.value === "" ? "" : Number(e.target.value) });

  return React.createElement(
    Modal,
    {
      open: true,
      onClose,
      title: isNew ? "Nouveau projet hôtelier" : "Modifier le projet",
      footer: [
        React.createElement(Button, { key: "c", variant: "secondary", onClick: onClose }, "Annuler"),
        React.createElement(Button, { key: "s", variant: "primary", icon: "save", onClick: () => onSave(form) }, "Enregistrer"),
      ],
    },
    React.createElement(
      "div",
      { className: "grid grid-cols-2 gap-4" },
      React.createElement(Field, { label: "Nom du projet", className: "col-span-2" }, React.createElement(TextInput, { value: form.name, onChange: set("name") })),
      React.createElement(Field, { label: "Ville" }, React.createElement(TextInput, { value: form.city, onChange: set("city") })),
      React.createElement(Field, { label: "Adresse" }, React.createElement(TextInput, { value: form.address, onChange: set("address") })),
      React.createElement(Field, { label: "Catégorie" }, React.createElement(Select, { options: App.Data.CATEGORY_OPTIONS, value: form.category, onChange: set("category") })),
      React.createElement(Field, { label: "Capacité (clés)" }, React.createElement(NumberInput, { value: form.keys, onChange: setNum("keys") })),
      React.createElement(Field, { label: "Statut" }, React.createElement(Select, { options: App.Data.STATUS_OPTIONS, value: form.status, onChange: set("status") })),
      React.createElement(
        Field,
        { label: "Favori" },
        React.createElement(
          "label",
          { className: "flex items-center gap-2 h-[38px] text-sm text-[var(--text)]" },
          React.createElement("input", { type: "checkbox", checked: form.favorite, onChange: set("favorite"), className: "w-4 h-4 accent-[var(--accent-gold)]" }),
          "Épingler en haut de liste"
        )
      ),
      React.createElement(
        "div",
        { className: "col-span-2 pt-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)]" },
        "Les hypothèses détaillées (ADR, TO, financement, CAPEX…) se paramètrent dans les onglets Business Plan, Cashflow & Financement, et Valorisation."
      )
    )
  );
}
