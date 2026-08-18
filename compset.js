/* ============================================================================
   TAB 3 — COMPSET & ÉTUDES DE MARCHÉ
   ============================================================================ */
window.App = window.App || {};
App.Tabs = App.Tabs || {};

App.Tabs.CompSet = function CompSetTab() {
  const { useState, useMemo, useRef, useEffect } = React;
  const { Card, Button, IconButton, Field, TextInput, NumberInput, Textarea, Fmt, SectionTitle, Badge, Icon, EmptyState, Modal } = App.UI;
  const ctx = React.useContext(App.Ctx);
  const { currentProject: p, updateProject, showToast } = ctx;

  const [cityFilter, setCityFilter] = useState("");
  const [preview, setPreview] = useState(null); // { rows, mapping } avant confirmation
  const fileRef = useRef(null);
  const pdfRef = useRef(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const compset = p.compset || [];
  const filtered = useMemo(
    () => (cityFilter ? compset.filter((c) => (c.city || "").toLowerCase().includes(cityFilter.toLowerCase())) : compset),
    [compset, cityFilter]
  );

  const indices = useMemo(() => App.Engine.computeMarketIndices(p), [p]);

  function setCompset(next) {
    updateProject((proj) => ({ ...proj, compset: next }));
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    App.Storage.parseCompSetFile(file, (result) => {
      if (result.error) {
        showToast("Import impossible : " + result.error, "error");
        return;
      }
      setPreview(result);
    });
    e.target.value = "";
  }

  function confirmImport() {
    setCompset([...compset, ...preview.rows]);
    showToast(`${preview.rows.length} établissement(s) importé(s).`, "success");
    setPreview(null);
  }

  function addManualRow() {
    setCompset([...compset, { id: App.Data.uid("cs"), hotel: "Nouvel hôtel", city: p.city || "", category: p.category, occ: 0.7, adr: 100, revpar: 70 }]);
  }
  function updateRow(id, key, value) {
    setCompset(compset.map((c) => (c.id === id ? { ...c, [key]: value, revpar: key === "occ" || key === "adr" ? (key === "occ" ? value : c.occ) * (key === "adr" ? value : c.adr) : c.revpar } : c)));
  }
  function removeRow(id) {
    setCompset(compset.filter((c) => c.id !== id));
  }

  function handlePdfDrop(e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer ? e.dataTransfer.files : e.target.files);
    if (!files.length) return;
    const entries = files.map((f) => ({ id: App.Data.uid("doc"), name: f.name, size: f.size, addedAt: new Date().toISOString() }));
    updateProject((proj) => ({ ...proj, marketFiles: [...(proj.marketFiles || []), ...entries] }));
    showToast(`${files.length} document(s) déposé(s) — pensez à en résumer le contenu ci-dessous.`, "success");
  }
  function removeFile(id) {
    updateProject((proj) => ({ ...proj, marketFiles: (proj.marketFiles || []).filter((f) => f.id !== id) }));
  }

  // Graphique comparatif TO / ADR / RevPAR
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();
    const rows = filtered.slice(0, 12);
    if (rows.length === 0) return;
    const isDark = document.documentElement.classList.contains("dark");
    const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const textColor = isDark ? "#8B93AC" : "#5B6478";
    chartInstance.current = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels: rows.map((r) => r.hotel || "—"),
        datasets: [
          { label: "ADR (€)", data: rows.map((r) => r.adr), backgroundColor: "#C9A227", borderRadius: 4, yAxisID: "y" },
          { label: "RevPAR (€)", data: rows.map((r) => r.revpar), backgroundColor: "#1FA97C", borderRadius: 4, yAxisID: "y" },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: textColor, font: { size: 10 }, maxRotation: 40, minRotation: 20 }, grid: { display: false } },
          y: { ticks: { color: textColor }, grid: { color: gridColor } },
        },
      },
    });
    return () => chartInstance.current && chartInstance.current.destroy();
  }, [filtered]);

  return React.createElement(
    "div",
    { className: "space-y-6" },
    React.createElement(SectionTitle, {
      eyebrow: "Étude de marché",
      title: "CompSet & positionnement concurrentiel",
      right: React.createElement(
        "div",
        { className: "flex gap-2" },
        React.createElement(Button, { variant: "secondary", size: "sm", icon: "plus", onClick: addManualRow }, "Ajouter manuellement"),
        React.createElement(Button, { variant: "primary", size: "sm", icon: "upload", onClick: () => fileRef.current.click() }, "Importer Excel / CSV"),
        React.createElement("input", { ref: fileRef, type: "file", accept: ".xlsx,.xls,.csv", className: "hidden", onChange: handleFile })
      ),
    }),

    // Indices de marché
    React.createElement(
      "div",
      { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
      React.createElement(App.UI.StatCard, { icon: "target", label: "MPI (pénétration)", value: indices ? indices.mpi.toFixed(0) : "—", sub: "TO projet vs marché", tone: indices && indices.mpi >= 100 ? "emerald" : "red" }),
      React.createElement(App.UI.StatCard, { icon: "dollar", label: "ARI (indice tarifaire)", value: indices ? indices.ari.toFixed(0) : "—", sub: "ADR projet vs marché", tone: indices && indices.ari >= 100 ? "emerald" : "red" }),
      React.createElement(App.UI.StatCard, { icon: "trendUp", label: "RGI (génération revenu)", value: indices ? indices.rgi.toFixed(0) : "—", sub: "RevPAR projet vs marché", tone: indices && indices.rgi >= 100 ? "emerald" : "red" }),
      React.createElement(App.UI.StatCard, { icon: "layers", label: "Comparables", value: compset.length, sub: (p.city || "toutes villes") + " et environs" })
    ),

    React.createElement(
      "div",
      { className: "grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start" },

      // Table + chart
      React.createElement(
        "div",
        { className: "space-y-6 min-w-0" },
        React.createElement(
          "div",
          { className: "flex items-center gap-3" },
          React.createElement(
            "div",
            { className: "relative flex-1 max-w-xs" },
            React.createElement(Icon, { name: "search", size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" }),
            React.createElement(TextInput, { placeholder: "Filtrer par ville…", value: cityFilter, onChange: (e) => setCityFilter(e.target.value), className: "pl-8" })
          )
        ),

        compset.length === 0
          ? React.createElement(EmptyState, {
              icon: "barChart",
              title: "Aucun comparable enregistré",
              message: "Importez un export Excel/CSV de votre étude STR/benchmark, ou ajoutez des hôtels comparables manuellement.",
              action: React.createElement(Button, { variant: "primary", icon: "upload", onClick: () => fileRef.current.click() }, "Importer un fichier"),
            })
          : React.createElement(
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
                    ["Hôtel", "Ville", "Catégorie", "TO", "ADR", "RevPAR", ""].map((h, i) => React.createElement("th", { key: i, className: "px-4 py-2.5 font-medium" }, h))
                  )
                ),
                React.createElement(
                  "tbody",
                  null,
                  filtered.map((c) =>
                    React.createElement(
                      "tr",
                      { key: c.id, className: "border-b border-[var(--border)] last:border-0" },
                      React.createElement("td", { className: "px-4 py-1.5" }, React.createElement(TextInput, { value: c.hotel, onChange: (e) => updateRow(c.id, "hotel", e.target.value), className: "min-w-[140px]" })),
                      React.createElement("td", { className: "px-4 py-1.5" }, React.createElement(TextInput, { value: c.city, onChange: (e) => updateRow(c.id, "city", e.target.value), className: "min-w-[100px]" })),
                      React.createElement("td", { className: "px-4 py-1.5" }, React.createElement(TextInput, { value: c.category, onChange: (e) => updateRow(c.id, "category", e.target.value), className: "min-w-[80px]" })),
                      React.createElement("td", { className: "px-4 py-1.5" }, React.createElement(NumberInput, { suffix: "%", value: Math.round(c.occ * 1000) / 10, onChange: (e) => updateRow(c.id, "occ", Number(e.target.value) / 100), className: "w-24" })),
                      React.createElement("td", { className: "px-4 py-1.5" }, React.createElement(NumberInput, { suffix: "€", value: c.adr, onChange: (e) => updateRow(c.id, "adr", Number(e.target.value)), className: "w-24" })),
                      React.createElement("td", { className: "px-4 py-1.5 font-mono tabular-nums text-[var(--text-muted)]" }, Fmt.num0(c.revpar) + " €"),
                      React.createElement("td", { className: "px-4 py-1.5" }, React.createElement(IconButton, { name: "trash", size: 14, onClick: () => removeRow(c.id), className: "hover:text-[var(--accent-red)]" }))
                    )
                  )
                )
              )
            ),

        compset.length > 0 &&
          React.createElement(
            Card,
            { className: "p-5" },
            React.createElement("h3", { className: "font-serif text-base mb-4" }, "Comparatif ADR / RevPAR"),
            React.createElement("div", { className: "h-72" }, React.createElement("canvas", { ref: chartRef }))
          )
      ),

      // Sidebar: notes + dépôt PDF
      React.createElement(
        Card,
        { className: "p-5 space-y-4" },
        React.createElement("h3", { className: "font-serif text-base flex items-center gap-2" }, React.createElement(Icon, { name: "fileText", size: 16, className: "text-[var(--accent-gold)]" }), "Rapports & études de marché"),
        React.createElement(
          "div",
          {
            onDragOver: (e) => e.preventDefault(),
            onDrop: handlePdfDrop,
            className: "border-2 border-dashed border-[var(--border)] rounded-xl p-5 text-center cursor-pointer hover:border-[var(--accent-gold)]/50 transition-colors",
            onClick: () => pdfRef.current.click(),
          },
          React.createElement(Icon, { name: "upload", size: 20, className: "mx-auto mb-2 text-[var(--text-muted)]" }),
          React.createElement("p", { className: "text-xs text-[var(--text-muted)]" }, "Déposez vos rapports PDF ici ou cliquez pour parcourir"),
          React.createElement("input", { ref: pdfRef, type: "file", accept: "application/pdf", multiple: true, className: "hidden", onChange: handlePdfDrop })
        ),
        (p.marketFiles || []).length > 0 &&
          React.createElement(
            "ul",
            { className: "space-y-1.5" },
            (p.marketFiles || []).map((f) =>
              React.createElement(
                "li",
                { key: f.id, className: "flex items-center justify-between text-xs bg-[var(--surface-2)] rounded-lg px-3 py-2" },
                React.createElement("span", { className: "truncate flex items-center gap-1.5" }, React.createElement(Icon, { name: "fileText", size: 12 }), f.name),
                React.createElement(IconButton, { name: "x", size: 12, onClick: () => removeFile(f.id) })
              )
            )
          ),
        React.createElement(Field, { label: "Synthèse de l'étude de marché" }, React.createElement(Textarea, {
          value: p.marketNotes,
          onChange: (e) => updateProject((proj) => ({ ...proj, marketNotes: e.target.value })),
          placeholder: "Tendances de marché, dynamique ADR/RevPAR, projets concurrents en pipeline…",
        }))
      )
    ),

    preview &&
      React.createElement(
        Modal,
        {
          open: true,
          onClose: () => setPreview(null),
          title: "Aperçu de l'import — vérifiez le mapping des colonnes",
          width: "max-w-3xl",
          footer: [
            React.createElement(Button, { key: "c", variant: "secondary", onClick: () => setPreview(null) }, "Annuler"),
            React.createElement(Button, { key: "s", variant: "primary", icon: "check", onClick: confirmImport }, `Importer ${preview.rows.length} ligne(s)`),
          ],
        },
        React.createElement(
          "div",
          { className: "text-xs text-[var(--text-muted)] mb-3" },
          "Colonnes détectées automatiquement : Hôtel, Ville, Catégorie, TO, ADR, RevPAR. Vous pourrez corriger chaque valeur après import."
        ),
        React.createElement(
          "div",
          { className: "overflow-x-auto max-h-80 border border-[var(--border)] rounded-lg" },
          React.createElement(
            "table",
            { className: "w-full text-xs" },
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                { className: "bg-[var(--surface-2)] text-left" },
                ["Hôtel", "Ville", "Catégorie", "TO", "ADR", "RevPAR"].map((h) => React.createElement("th", { key: h, className: "px-3 py-2 font-medium" }, h))
              )
            ),
            React.createElement(
              "tbody",
              null,
              preview.rows.slice(0, 50).map((r, i) =>
                React.createElement(
                  "tr",
                  { key: i, className: "border-t border-[var(--border)]" },
                  React.createElement("td", { className: "px-3 py-1.5" }, r.hotel),
                  React.createElement("td", { className: "px-3 py-1.5" }, r.city),
                  React.createElement("td", { className: "px-3 py-1.5" }, r.category),
                  React.createElement("td", { className: "px-3 py-1.5 font-mono" }, Fmt.pct(r.occ)),
                  React.createElement("td", { className: "px-3 py-1.5 font-mono" }, Fmt.num0(r.adr) + " €"),
                  React.createElement("td", { className: "px-3 py-1.5 font-mono" }, Fmt.num0(r.revpar) + " €")
                )
              )
            )
          )
        )
      )
  );
};
