/* ============================================================================
   STORAGE.JS — LocalStorage, Sauvegarde JSON, Parsing Excel & Exports Bankables
   ============================================================================ */
window.App = window.App || {};

App.Storage = (function () {
  "use strict";

  const KEY = "hotel_dashboard_v2";

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return App.Data.defaultState();
      return Object.assign(App.Data.defaultState(), JSON.parse(raw));
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
    downloadBlob(blob, `hotel-asset-dashboard-sauvegarde-${date}.json`);
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

  // ---- Parsing CompSet Excel/CSV --------------------------------------------
  function parseCompSetFile(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (json.length < 2) return callback({ rows: [], mapping: {}, error: "Fichier vide" });
        
        const rows = json.slice(1).filter((r) => r.some((c) => String(c).trim() !== "")).map((r) => {
          const occ = Number(String(r[3] || 0).replace(",", ".").replace("%", "")) / (String(r[3]).includes("%") ? 100 : 1);
          const adr = Number(String(r[4] || 0).replace(",", ".")) || 0;
          return {
            id: App.Data.uid("cs"),
            hotel: String(r[0] || "Hôtel"),
            city: String(r[1] || ""),
            category: String(r[2] || "4*"),
            occ: occ > 1 ? occ / 100 : occ,
            adr,
            revpar: occ * adr,
          };
        });
        callback({ rows, mapping: {}, headers: json[0] });
      } catch (err) {
        callback({ rows: [], mapping: {}, error: err.message });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ---- Export Excel complet .xlsx -------------------------------------------
  function exportXLSX(project) {
    const wb = XLSX.utils.book_new();
    const fmt = App.UI.Fmt;
    const uses = App.Engine.computeUsesAndSources(project);
    const usali = App.Engine.computeUSALI(project, 10);
    const dcf = App.Engine.computeDCF(project);

    // Feuille 1 : Fiche & Plan de Financement
    const planRows = [
      ["PROJET", project.name],
      ["VILLE", project.city],
      ["CATEGORIE", project.category],
      ["NOMBRE DE CLES", project.keys],
      ["TYPE D'OPERATION", project.projectType],
      [],
      ["EMPLOIS (Besoins)", "MONTANT (€)"],
      ["Acquisition Asset", uses.acqAsset],
      ["Licence 4", uses.acqLicence],
      ["Droits d'acquisition", uses.droitsAcq],
      ["Broker Fee HT", uses.brokerFee],
      ["Honoraires Avocats/Notaires", uses.lawyersFee],
      ["Frais Structuring / SH", uses.shFee],
      ["Travaux CAPEX HT", uses.capexTravaux],
      ["Financement FF&E HT", uses.ffe],
      ["AMO Travaux", uses.amoTravaux],
      ["TOTAL EMPLOIS", uses.totalEmplois],
      [],
      ["RESSOURCES (Financements)", "MONTANT (€)"],
      ["Equity Sponsor", uses.equityCalculated],
      ["Dette Acquisition", uses.detteAcq],
      ["Dette Travaux", uses.detteTravaux],
      ["TOTAL RESSOURCES", uses.totalRessources],
      [],
      ["RATIOS CLES"],
      ["Prix Acquisition / Clé", uses.pricePerKey],
      ["Prix de Revient Total / Clé", uses.totalCostPerKey],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(planRows), "Plan de Financement");

    // Feuille 2 : P&L USALI
    const usaliHeader = ["Poste", ...usali.map((r) => "Année " + r.year)];
    const usaliRows = [
      ["CA Hébergement", ...usali.map((r) => fmt.num(r.roomsRev))],
      ["CA Restauration", ...usali.map((r) => fmt.num(r.fbRev))],
      ["CA Autres produits", ...usali.map((r) => fmt.num(r.otherRev))],
      ["TOTAL CHIFFRE D'AFFAIRES", ...usali.map((r) => fmt.num(r.totalRev))],
      ["GOP (Gross Operating Profit)", ...usali.map((r) => fmt.num(r.gop))],
      ["Franchise Fees", ...usali.map((r) => fmt.num(r.franchiseFees))],
      ["Base Management Fees", ...usali.map((r) => fmt.num(r.baseMgtFee))],
      ["Incentive Management Fees", ...usali.map((r) => fmt.num(r.incentiveMgtFee))],
      ["Asset Management Fees", ...usali.map((r) => fmt.num(r.assetMgtFee))],
      ["Réserve FF&E", ...usali.map((r) => fmt.num(r.ffeReserve))],
      ["EBITDA", ...usali.map((r) => fmt.num(r.ebitda))],
      ["EBITDA % CA", ...usali.map((r) => fmt.pct(r.ebitdaPct))],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([usaliHeader, ...usaliRows]), "P&L USALI");

    // Feuille 3 : DCF & TRI
    const dcfRows = [
      ["Equity Investie", fmt.num(dcf.equity)],
      ["TRI Equity (IRR)", dcf.irr != null ? fmt.pct(dcf.irr) : "n/d"],
      ["VAN (NPV)", fmt.num(dcf.npv)],
      ["Multiple d'Exit EBITDA", project.valuation?.exitMultipleEbitda || 17],
      ["Valeur d'Exit Revente", fmt.num(dcf.exitValue)],
      ["Dette restante à l'Exit", fmt.num(dcf.remainingDebt)],
      ["Produit Net de Cession", fmt.num(dcf.netSaleProceeds)],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dcfRows), "DCF & Valuation");

    XLSX.writeFile(wb, `${slug(project.name)}-modélisation-asset.xlsx`);
  }

  function slug(s) {
    return (s || "projet").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  // ---- Export PDF Bankable --------------------------------------------------
  function exportPDF(project) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const fmt = App.UI.Fmt;
    const uses = App.Engine.computeUsesAndSources(project);
    const dcf = App.Engine.computeDCF(project);
    const usali = App.Engine.computeUSALI(project, 10);

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 595, 60, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(project.name || "Projet Hôtelier", 30, 35);

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("EXECUTIVE SUMMARY & PLAN DE FINANCEMENT", 30, 90);

    const summaryData = [
      ["Investissement Total (Emplois)", fmt.num0(uses.totalEmplois) + " €"],
      ["Prix de Revient / Clé", fmt.num0(uses.totalCostPerKey) + " €"],
      ["Equity Sponsor", fmt.num0(uses.equityCalculated) + " €"],
      ["Dette Totale Levee", fmt.num0(uses.totalDette) + " €"],
      ["TRI Equity Projeté", dcf.irr != null ? fmt.pct(dcf.irr) : "n/d"],
      ["EBITDA Stabilisé (A3)", fmt.num0(usali[2]?.ebitda || 0) + " €"],
    ];

    doc.autoTable({
      startY: 100,
      head: [["Métrique Asset", "Valeur"]],
      body: summaryData,
      theme: "striped",
      margin: { left: 30, right: 30 },
    });

    doc.save(`${slug(project.name)}-rapport-bankable.pdf`);
  }

  return { load, save, exportJSON, importJSON, parseCompSetFile, exportXLSX, exportPDF, downloadBlob };
})();
