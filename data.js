/* ============================================================================
   DATA.JS — Modèles de données, constantes et cas démo (Ex.xlsx)
   ============================================================================ */
window.App = window.App || {};

App.Data = (function () {
  "use strict";

  const STATUS_OPTIONS = ["Étude", "Négociation", "Signé", "Exploitation", "Rejeté"];
  const CATEGORY_OPTIONS = ["Économique", "1*", "2*", "3*", "4*", "4* plus", "5*", "Lifestyle / Boutique"];
  const PROJECT_TYPES = ["Greenfield", "Conversion", "Extension", "Acquisition", "Réhabilitation"];

  const STATUS_COLORS = {
    "Étude": "slate",
    "Négociation": "amber",
    "Signé": "blue",
    "Exploitation": "emerald",
    "Rejeté": "red",
  };

  const SCENARIO_LABELS = {
    prudent: "Prudent",
    central: "Central",
    optimiste: "Optimiste",
  };

  function uid(prefix) {
    return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  function defaultParams() {
    return {
      openDays: 365,
      adr: 120,
      occ: 0.70,
      rampUp: [0.60, 0.80, 0.95, 1, 1, 1, 1, 1, 1, 1],
      revInflation: 0.02,
      costInflation: 0.02,
      fbPct: 0.20,
      otherPct: 0.05,
      roomsExpPct: 0.24,
      fbExpPct: 0.68,
      otherExpPct: 0.45,
      agPct: 0.07,
      smPct: 0.06,
      pomPct: 0.05,
      utilitiesPct: 0.04,
      franchiseFeePct: 0.02,
      baseMgtFeePct: 0.03,
      incentiveMgtFeePct: 0.10,
      assetMgtFeePct: 0.01,
      propertyTaxPct: 0.015,
      insurancePct: 0.01,
      ffePct: 0.04,
    };
  }

  function newProject(overrides) {
    const now = new Date().toISOString();
    const base = {
      id: uid("proj"),
      name: "Nouveau projet hôtelier",
      city: "",
      address: "",
      category: "4*",
      projectType: "Acquisition",
      keys: 50,
      status: "Étude",
      favorite: false,
      createdAt: now,
      updatedAt: now,

      identity: {
        erpType: "Type O cat. 5",
        brand: "",
        restaurant: true,
        surface: 2500,
        authorization: "Purgé",
        seller: "",
        etp: 20,
        broker: "",
        dealType: "Asset Deal",
        auditDone: false,
        targetAcquisitionDate: "2026-Q2",
        suspensiveConditions: "Financement",
        askingPrice: 5000000,
        proposedPrice: 5000000,
        investors: "Sponsor / Co-investisseurs",
        developer: "",
        operator: "",
      },

      capTable: [
        { id: uid("cap"), name: "Equity Sponsor", amount: 2000000, shares: 2000, pct: 100 }
      ],

      usesSources: {
        assetPrice: 5000000,
        licencePrice: 30000,
        dettesExigibles: 0,
        droitsAcqPct: 0.07,
        brokerFeeHt: 250000,
        lawyersFee: 15000,
        shFeePct: 0.025,
        capexTravauxHt: 3000000,
        ffeHt: 800000,
        amoTravauxPct: 0.04,
        bfrInitial: 100000,
        equityPctTarget: 0.40,
        detteAcquisitionPct: 0.60,
        detteTravauxPct: 0.60,
      },

      params: defaultParams(),
      overrides: {},

      scenarios: {
        prudent: { occDelta: -0.08, adrDelta: -0.06, costInflationDelta: 0.01 },
        central: { occDelta: 0, adrDelta: 0, costInflationDelta: 0 },
        optimiste: { occDelta: 0.05, adrDelta: 0.05, costInflationDelta: -0.005 },
      },
      activeScenario: "central",
      notes: "",
      compset: [],
      marketNotes: "",
      marketFiles: [],

      financing: {
        detteAcquisition: { amount: 3000000, rate: 0.035, durationYears: 15, deferralYears: 3 },
        detteTravaux: { amount: 1800000, rate: 0.035, durationYears: 15, deferralYears: 2 },
        dscrTarget: 1.25,
      },

      capex: {
        ffePctOverride: null,
        schedule: [],
      },

      valuation: {
        discountRate: 0.09,
        exitYear: 10,
        exitMultipleEbitda: 17,
        exitCapRate: 0.065,
      },
    };
    return Object.assign(base, overrides || {});
  }

  function demoProject() {
    const p = newProject({
      name: "#1 HOTEL STATION ALPES TOP 10",
      city: "Alpes Station",
      address: "Domaine Skiable Alpes Top 10",
      category: "4* plus",
      projectType: "Réhabilitation",
      keys: 65,
      status: "Exploitation",
      favorite: true,
    });

    p.identity = {
      erpType: "Hôtel ERP type O cat. 5",
      brand: "Handwritten Collection",
      restaurant: true,
      surface: 4569,
      authorization: "Pas de PC",
      seller: "Privé",
      etp: 35,
      broker: "LVRi",
      dealType: "Asset Deal",
      auditDone: true,
      targetAcquisitionDate: "T2 2026 (après saison)",
      suspensiveConditions: "Financement / Travaux",
      askingPrice: 5900000,
      proposedPrice: 5900000,
      investors: "Fonds Asset Management Hôtelier",
      developer: "Sponsor Hôtelier",
      operator: "Accor / Handwritten Collection",
    };

    p.capTable = [
      { id: uid("cap"), name: "Sponsor Equity", amount: 7200250, shares: 720025, pct: 100 }
    ];

    p.usesSources = {
      assetPrice: 5900000,
      licencePrice: 30000,
      dettesExigibles: 0,
      droitsAcqPct: 0.07,
      brokerFeeHt: 300000,
      lawyersFee: 15000,
      shFeePct: 0.025,
      capexTravauxHt: 6900000,
      ffeHt: 2000000,
      amoTravauxPct: 0.04,
      bfrInitial: 0,
      equityPctTarget: 0.4414,
      detteAcquisitionPct: 0.60,
      detteTravauxPct: 0.60,
    };

    p.params = {
      openDays: 227,
      adr: 305,
      occ: 0.66,
      rampUp: [0.68, 0.86, 1.0, 1.12, 1.12, 1.12, 1.12, 1.12, 1.12, 1.12],
      revInflation: 0.02,
      costInflation: 0.02,
      fbPct: 0.28,
      otherPct: 0.08,
      roomsExpPct: 0.22,
      fbExpPct: 0.65,
      otherExpPct: 0.40,
      agPct: 0.06,
      smPct: 0.05,
      pomPct: 0.04,
      utilitiesPct: 0.045,
      franchiseFeePct: 0.02,
      baseMgtFeePct: 0.05,
      incentiveMgtFeePct: 0.10,
      assetMgtFeePct: 0.01,
      propertyTaxPct: 0.01,
      insurancePct: 0.008,
      ffePct: 0.04,
    };

    p.financing = {
      detteAcquisition: { amount: 3558000, rate: 0.032, durationYears: 15, deferralYears: 3 },
      detteTravaux: { amount: 5553600, rate: 0.032, durationYears: 15, deferralYears: 2 },
      dscrTarget: 1.25,
    };

    p.valuation = {
      discountRate: 0.09,
      exitYear: 10,
      exitMultipleEbitda: 17,
      exitCapRate: 0.06,
    };

    return p;
  }

  function defaultState() {
    return {
      version: 2,
      theme: "dark",
      view: "cards",
      projects: [],
      activeProjectId: null,
    };
  }

  return {
    STATUS_OPTIONS,
    CATEGORY_OPTIONS,
    PROJECT_TYPES,
    STATUS_COLORS,
    SCENARIO_LABELS,
    uid,
    defaultParams,
    newProject,
    demoProject,
    defaultState,
  };
})();
