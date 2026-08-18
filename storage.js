/* ============================================================================
   STORAGE.JS — Persistance LocalStorage, sauvegarde JSON, exports XLSX / PDF
   ============================================================================ */
window.App = window.App || {};

App.Storage = (function () {
  "use strict";

  const KEY = "hotel_dashboard_v1";

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return App.Data.defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign(App.Data.defaultState(), parsed);
    } catch (e) {
      console.error("Erreur de lecture LocalStorage", e);
      return App.Data.defaultState();
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error("Erreur d'écriture LocalStorage", e);
      return false;
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function exportJSON(state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const date = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `hotel-dashboard-sauvegarde-${date}.json`);
  }

  function importJSON(file, onSuccess, onError) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || !Array.isArray(parsed.projects)) throw new Error("Format de sauvegarde invalide");
        onSuccess(Object.assign(App.Data.defaultState(), parsed));
      } catch (err) {
        onError(err);
      }
    };
    reader.onerror = () => onError(new Error("Impossible de lire le fichier"));
    reader.readAsText(file);
  }

  // ---- Import CompSet Excel/CSV via SheetJS ---------------------------------
  const HEADER_ALIASES = {
    hotel: ["hotel", "hôtel", "nom", "name", "établissement", "etablissement"],
    city: ["ville", "city", "localisation", "location"],
    category: ["catégorie", "categorie", "category", "standing", "étoiles", "etoiles", "stars"],
    occ: ["to", "occ", "occupation", "occupancy", "taux d'occupation", "taux doccupation"],
    adr: ["adr", "prix moyen", "prix moyen chambre", "average rate", "rate"],
    revpar: ["revpar", "rev par"],
  };

  function guessColumn(headers, field) {
    const aliases = HEADER_ALIASES[field];
    const normalized = headers.map((h) => String(h || "").trim().toLowerCase());
    for (const alias of aliases) {
      const idx = normalized.findIndex((h) => h === alias);
      if (idx !== -1) return idx;
    }
    for (const alias of aliases) {
      const idx = normalized.findIndex((h) => h.includes(alias));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  function toRatio(v) {
    const n = Number(String(v).replace(",", ".").replace("%", ""));
    if (isNaN(n)) return 0;
    return n > 1 ? n / 100 : n;
  }

  /** Parse un fichier Excel/CSV et retourne { rows, mapping } avec auto-mapping des colonnes. */
  function parseCompSetFile(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (json.length < 2) return callback({ rows: [], mapping: {}, error: "Fichier vide ou sans données" });
        const headers = json[0];
        const mapping = {
          hotel: guessColumn(headers, "hotel"),
          city: guessColumn(headers, "city"),
          category: guessColumn(headers, "category"),
          occ: guessColumn(headers, "occ"),
          adr: guessColumn(headers, "adr"),
          revpar: guessColumn(headers, "revpar"),
        };
        const rows = json.slice(1).filter((r) => r.some((c) => String(c).trim() !== "")).map((r) => {
          const occ = mapping.occ !== -1 ? toRatio(r[mapping.occ]) : 0;
          const adr = mapping.adr !== -1 ? Number(String(r[mapping.adr]).replace(",", ".")) || 0 : 0;
          const revparRaw = mapping.revpar !== -1 ? Number(String(r[mapping.revpar]).replace(",", ".")) || 0 : 0;
          return {
            id: App.Data.uid("cs"),
            hotel: mapping.hotel !== -1 ? String(r[mapping.hotel]) : "",
            city: mapping.city !== -1 ? String(r[mapping.city]) : "",
            category: mapping.category !== -1 ? String(r[mapping.category]) : "",
            occ, adr,
            revpar: revparRaw || occ * adr,
          };
        });
        callback({ rows, mapping, headers });
      } catch (err) {
        callback({ rows: [], mapping: {}, error: err.message });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ---- Export Excel complet du projet ---------------------------------------
  function exportXLSX(project) {
    const wb = XLSX.utils.book_new();
    const fmt = App.UI.Fmt;

    // Feuille Récapitulatif
    const recap = [
      ["Projet", project.name],
      ["Ville", project.city],
      ["Adresse", project.address],
      ["Catégorie", project.category],
      ["Capacité (clés)", project.keys],
      ["Statut", project.status],
      ["Scénario actif", App.Data.SCENARIO_LABELS[project.activeScenario]],
      [],
      ["Notes d'analyse"],
      [project.notes || ""],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(recap), "Récapitulatif");

    // Feuille P&L USALI
    const usali = App.Engine.computeUSALI(project, 10);
    const usaliHeader = ["Poste", ...usali.map((r) => "Année " + r.year)];
    const usaliRows = [
      ["Taux d'occupation", ...usali.map((r) => fmt.pct(r.occ))],
      ["ADR (€)", ...usali.map((r) => fmt.num(r.adr))],
      ["RevPAR (€)", ...usali.map((r) => fmt.num(r.revpar))],
      ["CA Hébergement", ...usali.map((r) => fmt.num(r.roomsRev))],
      ["CA Restauration", ...usali.map((r) => fmt.num(r.fbRev))],
      ["CA Autres", ...usali.map((r) => fmt.num(r.otherRev))],
      ["CA Total", ...usali.map((r) => fmt.num(r.totalRev))],
      ["Charges Hébergement", ...usali.map((r) => fmt.num(r.roomsExp))],
      ["Charges Restauration", ...usali.map((r) => fmt.num(r.fbExp))],
      ["Charges Autres", ...usali.map((r) => fmt.num(r.otherExp))],
      ["Profit départemental", ...usali.map((r) => fmt.num(r.deptProfit))],
      ["Frais généraux & admin", ...usali.map((r) => fmt.num(r.ag))],
      ["Marketing & Ventes", ...usali.map((r) => fmt.num(r.sm))],
      ["Maintenance", ...usali.map((r) => fmt.num(r.pom))],
      ["Énergie / Utilities", ...usali.map((r) => fmt.num(r.utilities))],
      ["GOP", ...usali.map((r) => fmt.num(r.gop))],
      ["GOP %", ...usali.map((r) => fmt.pct(r.gopPct))],
      ["Frais de gestion", ...usali.map((r) => fmt.num(r.mgmtFee))],
      ["Taxe foncière", ...usali.map((r) => fmt.num(r.propertyTax))],
      ["Assurances", ...usali.map((r) => fmt.num(r.insurance))],
      ["Réserve FF&E", ...usali.map((r) => fmt.num(r.ffeReserve))],
      ["EBITDA", ...usali.map((r) => fmt.num(r.ebitda))],
      ["EBITDA %", ...usali.map((r) => fmt.pct(r.ebitdaPct))],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([usaliHeader, ...usaliRows]), "P&L USALI");

    // Feuille CompSet
    const csHeader = ["Hôtel", "Ville", "Catégorie", "TO", "ADR", "RevPAR"];
    const csRows = (project.compset || []).map((c) => [c.hotel, c.city, c.category, fmt.pct(c.occ), fmt.num(c.adr), fmt.num(c.revpar)]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([csHeader, ...csRows]), "CompSet");

    // Feuille Cashflow
    const cf = App.Engine.computeCashflow(project, 10);
    const cfHeader = ["Année", "EBITDA", "CAPEX lourds", "Intérêts", "Principal", "Service dette", "Flux net", "Flux cumulé", "DSCR"];
    const cfRows = cf.map((r) => [r.year, fmt.num(r.ebitda), fmt.num(r.capexHeavy), fmt.num(r.interest), fmt.num(r.principal), fmt.num(r.debtService), fmt.num(r.netCashFlow), fmt.num(r.cumulativeCashFlow), r.dscr != null ? r.dscr.toFixed(2) : "—"]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([cfHeader, ...cfRows]), "Cashflow");

    // Feuille Amortissement
    const amort = App.Engine.computeAmortization(project.financing, project.financing.durationYears || 10);
    const amHeader = ["Année", "Intérêts", "Principal", "Service dette", "Solde restant"];
    const amRows = amort.annual.map((r) => [r.year, fmt.num(r.interest), fmt.num(r.principal), fmt.num(r.debtService), fmt.num(r.endingBalance)]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([amHeader, ...amRows]), "Amortissement");

    // Feuille DCF
    const dcf = App.Engine.computeDCF(project);
    const dcfRows = [
      ["VAN (NPV)", fmt.num(dcf.npv)],
      ["TRI (IRR)", dcf.irr != null ? fmt.pct(dcf.irr) : "n/d"],
      ["Payback (années)", dcf.payback != null ? dcf.payback.toFixed(1) : "n/d"],
      ["Valeur de sortie", fmt.num(dcf.exitValue)],
      ["Dette restante à la sortie", fmt.num(dcf.remainingDebt)],
      ["Produit net de cession", fmt.num(dcf.netSaleProceeds)],
      [],
      ["Année", "Flux equity"],
      ...dcf.equityCF.map((v, i) => [i === 0 ? "T0" : "Année " + i, fmt.num(v)]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dcfRows), "DCF & TRI");

    XLSX.writeFile(wb, `${slug(project.name)}-etude-financiere.xlsx`);
  }

  function slug(s) {
    return (s || "projet")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // ---- Export PDF "Bankable" (2 pages) ---------------------------------------
  function exportPDF(project) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const fmt = App.UI.Fmt;
    const usali = App.Engine.computeUSALI(project, 10);
    const dcf = App.Engine.computeDCF(project);
    const cf = App.Engine.computeCashflow(project, 10);
    const stab = usali[Math.min(3, usali.length - 1)];

    const pageWidth = doc.internal.pageSize.getWidth();
    const gold = [201, 162, 39];
    const navy = [15, 23, 42];
    const muted = [100, 108, 130];

    // ---- Page 1 : Executive Summary --------------------------------------
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, pageWidth, 70, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(project.name || "Projet hôtelier", 40, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(230, 230, 230);
    doc.text(`${project.city || ""}  ·  ${project.category || ""}  ·  ${project.keys || 0} clés  ·  Statut : ${project.status || ""}`, 40, 50);

    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Executive Summary", 40, 100);
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(1.5);
    doc.line(40, 106, 130, 106);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    const notesText = doc.splitTextToSize(project.notes || "Aucune note d'analyse renseignée.", pageWidth - 80);
    doc.text(notesText, 40, 122);

    // Cartes KPI
    const kpis = [
      ["ADR stabilisé", fmt.num(stab.adr) + " €"],
      ["TO stabilisé", fmt.pct(stab.occ)],
      ["RevPAR stabilisé", fmt.num(stab.revpar) + " €"],
      ["EBITDA Y4", fmt.num(stab.ebitda) + " €"],
      ["TRI (equity)", dcf.irr != null ? fmt.pct(dcf.irr) : "n/d"],
      ["VAN (NPV)", fmt.num(dcf.npv) + " €"],
      ["Payback", dcf.payback != null ? dcf.payback.toFixed(1) + " ans" : "n/d"],
      ["Valeur de sortie", fmt.num(dcf.exitValue) + " €"],
    ];
    let ky = 175;
    const colW = (pageWidth - 80) / 4;
    kpis.forEach((k, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const x = 40 + col * colW;
      const y = ky + row * 62;
      doc.setFillColor(246, 246, 248);
      doc.roundedRect(x, y, colW - 10, 50, 4, 4, "F");
      doc.setTextColor(muted[0], muted[1], muted[2]);
      doc.setFontSize(8);
      doc.text(k[0], x + 8, y + 18);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      doc.text(k[1], x + 8, y + 36);
      doc.setFont("helvetica", "normal");
    });

    // Ratios bancaires
    let by = ky + 2 * 62 + 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text("Ratios bancaires clés", 40, by);
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.line(40, by + 6, 170, by + 6);

    const avgDscr = cf.filter((r) => r.dscr != null).reduce((s, r, _, arr) => s + r.dscr / arr.length, 0);
    const bankRows = [
      ["Montant emprunté", fmt.num(project.financing.loanAmount) + " €"],
      ["Taux d'intérêt", fmt.pct(project.financing.rate)],
      ["Durée", project.financing.durationYears + " ans"],
      ["Différé", project.financing.durationYears ? project.financing.deferralYears + " an(s)" : "—"],
      ["DSCR moyen projeté", avgDscr ? avgDscr.toFixed(2) + "x" : "n/d"],
      ["LTC (Loan-to-Cost)", project.financing.totalCapex ? fmt.pct(project.financing.loanAmount / project.financing.totalCapex) : "n/d"],
    ];
    doc.autoTable({
      startY: by + 16,
      head: [["Indicateur", "Valeur"]],
      body: bankRows,
      theme: "plain",
      styles: { fontSize: 9.5, cellPadding: 5 },
      headStyles: { fillColor: navy, textColor: 255 },
      margin: { left: 40, right: 40 },
    });

    doc.setFontSize(7.5);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text("Document généré automatiquement — Hotel Feasibility Dashboard · À usage interne / partenaires financiers", 40, 815);

    // ---- Page 2 : P&L USALI + amortissement --------------------------------
    doc.addPage();
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(0, 0, pageWidth, 46, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Compte de résultat USALI (10 ans)", 40, 28);

    const usaliBody = [
      ["CA Total (€)", ...usali.map((r) => fmt.num0(r.totalRev))],
      ["GOP (€)", ...usali.map((r) => fmt.num0(r.gop))],
      ["GOP %", ...usali.map((r) => fmt.pct(r.gopPct))],
      ["EBITDA (€)", ...usali.map((r) => fmt.num0(r.ebitda))],
      ["EBITDA %", ...usali.map((r) => fmt.pct(r.ebitdaPct))],
    ];
    doc.autoTable({
      startY: 62,
      head: [["Indicateur", ...usali.map((r) => "A" + r.year)]],
      body: usaliBody,
      theme: "grid",
      styles: { fontSize: 7.2, cellPadding: 3, halign: "right" },
      headStyles: { fillColor: navy, textColor: 255, halign: "center" },
      columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
      margin: { left: 40, right: 40 },
    });

    let y2 = doc.lastAutoTable.finalY + 24;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text("Trésorerie & couverture de la dette", 40, y2);
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.line(40, y2 + 6, 230, y2 + 6);

    const cfBody = cf.map((r) => [
      "Année " + r.year,
      fmt.num0(r.ebitda),
      fmt.num0(r.debtService),
      fmt.num0(r.netCashFlow),
      r.dscr != null ? r.dscr.toFixed(2) + "x" : "—",
    ]);
    doc.autoTable({
      startY: y2 + 16,
      head: [["Année", "EBITDA", "Service dette", "Flux net", "DSCR"]],
      body: cfBody,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 4, halign: "right" },
      headStyles: { fillColor: navy, textColor: 255 },
      columnStyles: { 0: { halign: "left" } },
      margin: { left: 40, right: 40 },
    });

    doc.setFontSize(7.5);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text("Page 2/2 — Hypothèses et détails méthodologiques disponibles sur demande.", 40, 815);

    doc.save(`${slug(project.name)}-rapport-bankable.pdf`);
  }

  return { load, save, exportJSON, importJSON, parseCompSetFile, exportXLSX, exportPDF, downloadBlob };
})();
