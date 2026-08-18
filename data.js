/* ============================================================================
   DATA.JS — Constantes métier, données de démonstration, modèles par défaut
   ============================================================================ */
window.App = window.App || {};

App.Data = (function () {
  "use strict";

  const STATUS_OPTIONS = ["Étude", "Négociation", "Signé", "Exploitation"];
  const CATEGORY_OPTIONS = ["Économique", "1*", "2*", "3*", "4*", "5*", "Lifestyle / Boutique"];

  const STATUS_COLORS = {
    "Étude": "slate",
    "Négociation": "amber",
    "Signé": "blue",
    "Exploitation": "emerald",
  };

  const SCENARIO_LABELS = {
    prudent: "Prudent",
    central: "Central",
    optimiste: "Optimiste",
  };

  // ---- Paramètres par défaut d'un nouveau projet ----------------------------
  function defaultParams() {
    return {
      adr: 120,
      occ: 0.72,
      rampUp: [0.62, 0.82, 0.95, 1, 1, 1, 1, 1, 1, 1],
      revInflation: 0.02,
      costInflation: 0.025,
      fbPct: 0.18,
      otherPct: 0.05,
      roomsExpPct: 0.24,
      fbExpPct: 0.68,
      otherExpPct: 0.45,
      agPct: 0.07,
      smPct: 0.06,
      pomPct: 0.05,
      utilitiesPct: 0.04,
      mgmtFeePct: 0.03,
      propertyTaxPct: 0.02,
      insurancePct: 0.01,
      ffePct: 0.04,
    };
  }

  function defaultScenarios() {
    return {
      prudent: { occDelta: -0.08, adrDelta: -0.06, costInflationDelta: 0.01 },
      central: { occDelta: 0, adrDelta: 0, costInflationDelta: 0 },
      optimiste: { occDelta: 0.05, adrDelta: 0.05, costInflationDelta: -0.005 },
    };
  }

  function uid(prefix) {
    return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  function newProject(overrides) {
    const now = new Date().toISOString();
    const base = {
      id: uid("proj"),
      name: "Nouveau projet hôtelier",
      city: "",
      address: "",
      category: "3*",
      keys: 60,
      status: "Étude",
      favorite: false,
      createdAt: now,
      updatedAt: now,
      params: defaultParams(),
      scenarios: defaultScenarios(),
      activeScenario: "central",
      notes: "",
      compset: [],
      marketNotes: "",
      marketFiles: [],
      financing: {
        totalCapex: 8000000,
        equity: 2400000,
        loanAmount: 5600000,
        rate: 0.045,
        durationYears: 15,
        deferralYears: 1,
        dscrTarget: 1.25,
      },
      capex: {
        ffePctOverride: null,
        schedule: [],
      },
      valuation: {
        discountRate: 0.09,
        exitYear: 10,
        exitCapRate: 0.07,
      },
    };
    return Object.assign(base, overrides || {});
  }

  // ---- Projet de démonstration complet --------------------------------------
  function demoProject() {
    const p = newProject({
      name: "Boutique Hôtel Paris — 45 clés",
      city: "Paris",
      address: "12 rue de la Roquette, 75011 Paris",
      category: "4*",
      keys: 45,
      status: "Négociation",
      favorite: true,
    });

    p.params = {
      adr: 210,
      occ: 0.78,
      rampUp: [0.58, 0.80, 0.94, 1, 1, 1, 1, 1, 1, 1],
      revInflation: 0.025,
      costInflation: 0.03,
      fbPct: 0.20,
      otherPct: 0.06,
      roomsExpPct: 0.22,
      fbExpPct: 0.66,
      otherExpPct: 0.40,
      agPct: 0.065,
      smPct: 0.055,
      pomPct: 0.045,
      utilitiesPct: 0.035,
      mgmtFeePct: 0.03,
      propertyTaxPct: 0.018,
      insurancePct: 0.009,
      ffePct: 0.04,
    };

    p.notes =
      "Actif boutique en plein cœur du 11e arrondissement, à fort potentiel de repositionnement lifestyle. " +
      "Montée en charge attendue rapide compte tenu de la localisation. Hypothèses calées sur le marché parisien 4* " +
      "haussmannien avec forte saisonnalité loisirs/affaires. Point de vigilance : coût des travaux de rénovation des " +
      "45 chambres et mise aux normes accessibilité.";

    p.compset = [
      { id: uid("cs"), hotel: "Hôtel Fabric", city: "Paris", category: "4*", occ: 0.80, adr: 195, revpar: 156 },
      { id: uid("cs"), hotel: "Maison Bréguet", city: "Paris", category: "4*", occ: 0.76, adr: 220, revpar: 167 },
      { id: uid("cs"), hotel: "Hôtel Amastan", city: "Paris", category: "4*", occ: 0.79, adr: 240, revpar: 190 },
      { id: uid("cs"), hotel: "Le Général Hôtel", city: "Paris", category: "4*", occ: 0.74, adr: 185, revpar: 137 },
      { id: uid("cs"), hotel: "Hôtel Original Paris", city: "Paris", category: "3*", occ: 0.81, adr: 150, revpar: 122 },
    ];
    p.marketNotes =
      "Marché parisien 4* lifestyle en croissance continue de l'ADR depuis 2023, porté par la clientèle internationale " +
      "loisirs et une offre corporate haut de gamme réduite dans le 11e. RevPAR de la zone en hausse structurelle.";

    p.financing = {
      totalCapex: 9800000,
      equity: 2940000,
      loanAmount: 6860000,
      rate: 0.042,
      durationYears: 15,
      deferralYears: 1,
      dscrTarget: 1.25,
    };

    p.capex.schedule = [
      { id: uid("cx"), year: 1, label: "Rénovation lourde 45 chambres", amount: 1350000 },
      { id: uid("cx"), year: 5, label: "Rénovation soft rooms + lobby", amount: 420000 },
      { id: uid("cx"), year: 8, label: "Mise à niveau technique (CVC / IT)", amount: 260000 },
    ];

    p.valuation = { discountRate: 0.095, exitYear: 10, exitCapRate: 0.065 };

    return p;
  }

  function defaultState() {
    return {
      version: 1,
      theme: "dark",
      view: "cards",
      projects: [],
      activeProjectId: null,
    };
  }

  return {
    STATUS_OPTIONS,
    CATEGORY_OPTIONS,
    STATUS_COLORS,
    SCENARIO_LABELS,
    uid,
    defaultParams,
    defaultScenarios,
    newProject,
    demoProject,
    defaultState,
  };
})();
