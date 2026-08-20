/* ============================================================================
   ENGINE.JS — Moteur de calcul financier hôtelier (Portfolio & Projet)
   ============================================================================ */
window.App = window.App || {};

App.Engine = (function () {
  "use strict";

  /** Calcule l'équilibre du Plan de Financement (Emplois & Ressources). */
  function computeUsesAndSources(project) {
    const u = project.usesSources || {};

    const acqAsset = Number(u.assetPrice) || 0;
    const acqLicence = Number(u.licencePrice) || 0;
    const dettesExigibles = Number(u.dettesExigibles) || 0;
    const totalAcq = acqAsset + acqLicence + dettesExigibles;

    const droitsAcq = acqAsset * (Number(u.droitsAcqPct) || 0);
    const brokerFee = Number(u.brokerFeeHt) || 0;
    const lawyersFee = Number(u.lawyersFee) || 0;
    const shFee = acqAsset * (Number(u.shFeePct) || 0);
    const totalFrais = droitsAcq + brokerFee + lawyersFee + shFee;

    const capexTravaux = Number(u.capexTravauxHt) || 0;
    const ffe = Number(u.ffeHt) || 0;
    const amoTravaux = capexTravaux * (Number(u.amoTravauxPct) || 0);
    const bfr = Number(u.bfrInitial) || 0;
    const totalOps = capexTravaux + ffe + amoTravaux + bfr;

    const totalEmplois = totalAcq + totalFrais + totalOps;

    // Ressources
    const detteAcq = Number(project.financing?.detteAcquisition?.amount) || 0;
    const detteTravaux = Number(project.financing?.detteTravaux?.amount) || 0;
    const totalDette = detteAcq + detteTravaux;

    // L'Equity équilibre le besoin
    const equityCalculated = Math.max(0, totalEmplois - totalDette);
    const totalRessources = equityCalculated + totalDette;

    const keys = Number(project.keys) || 1;
    const pricePerKey = totalAcq / keys;
    const totalCostPerKey = totalEmplois / keys;

    return {
      acqAsset, acqLicence, dettesExigibles, totalAcq,
      droitsAcq, brokerFee, lawyersFee, shFee, totalFrais,
      capexTravaux, ffe, amoTravaux, bfr, totalOps,
      totalEmplois,
      detteAcq, detteTravaux, totalDette,
      equityCalculated, totalRessources,
      balance: totalEmplois - totalRessources,
      pricePerKey, totalCostPerKey,
    };
  }

  /** USALI P&L complet avec gestion des Fees & Overrides. */
  function computeUSALI(project, years) {
    years = years || 10;
    const p = App.Engine.getEffectiveParams(project);
    const keys = Number(project.keys) || 0;
    const openDays = Number(p.openDays) || 365;
    const overrides = project.overrides || {};
    const uses = computeUsesAndSources(project);
    const gav = uses.totalEmplois;

    const rows = [];

    for (let y = 1; y <= years; y++) {
      const rampMult = p.rampUp[y - 1] != null ? p.rampUp[y - 1] : 1;
      const infRev = Math.pow(1 + p.revInflation, y - 1);
      const infCost = Math.pow(1 + p.costInflation, y - 1);

      const occ = Math.min(1, Math.max(0, p.occ * rampMult));
      const adr = p.adr * infRev;
      const revpar = occ * adr;

      let roomsRev = keys * openDays * occ * adr;
      let fbRev = roomsRev * p.fbPct;
      let otherRev = roomsRev * p.otherPct;
      let totalRev = roomsRev + fbRev + otherRev;

      // Surcharges manuelles (overrides)
      if (overrides[`totalRev_A${y}`] != null) totalRev = Number(overrides[`totalRev_A${y}`]);

      const roomsExp = roomsRev * p.roomsExpPct;
      const fbExp = fbRev * p.fbExpPct;
      const otherExp = otherRev * p.otherExpPct;
      const totalDeptExp = roomsExp + fbExp + otherExp;

      const deptProfit = totalRev - totalDeptExp;

      const ag = totalRev * p.agPct * (infCost / infRev);
      const sm = totalRev * p.smPct * (infCost / infRev);
      const pom = totalRev * p.pomPct * (infCost / infRev);
      const utilities = totalRev * p.utilitiesPct * (infCost / infRev);
      const undistributed = ag + sm + pom + utilities;

      const gop = deptProfit - undistributed;

      // Fees
      const franchiseFees = roomsRev * (p.franchiseFeePct || 0);
      const baseMgtFee = totalRev * (p.baseMgtFeePct || 0);
      const incentiveMgtFee = Math.max(0, gop * (p.incentiveMgtFeePct || 0));
      const assetMgtFee = gav * (p.assetMgtFeePct || 0);

      const propertyTax = totalRev * p.propertyTaxPct;
      const insurance = totalRev * p.insurancePct;
      const ffeReserve = totalRev * (project.capex?.ffePctOverride ?? p.ffePct);

      const totalFees = franchiseFees + baseMgtFee + incentiveMgtFee + assetMgtFee;
      const nonOpTotal = totalFees + propertyTax + insurance + ffeReserve;

      let ebitda = gop - nonOpTotal;
      if (overrides[`ebitda_A${y}`] != null) ebitda = Number(overrides[`ebitda_A${y}`]);

      rows.push({
        year: y, occ, adr, revpar,
        roomsRev, fbRev, otherRev, totalRev,
        roomsExp, fbExp, otherExp, totalDeptExp, deptProfit,
        ag, sm, pom, utilities, undistributed,
        gop, gopPct: totalRev > 0 ? gop / totalRev : 0,
        franchiseFees, baseMgtFee, incentiveMgtFee, assetMgtFee, totalFees,
        propertyTax, insurance, ffeReserve, nonOpTotal,
        ebitda, ebitdaPct: totalRev > 0 ? ebitda / totalRev : 0,
      });
    }
    return rows;
  }

  function getEffectiveParams(project) {
    const base = project.params;
    const scn = project.scenarios?.[project.activeScenario] || { occDelta: 0, adrDelta: 0, costInflationDelta: 0 };
    return Object.assign({}, base, {
      occ: Math.min(1, Math.max(0, base.occ + (scn.occDelta || 0))),
      adr: Math.max(0, base.adr * (1 + (scn.adrDelta || 0))),
      costInflation: Math.max(0, base.costInflation + (scn.costInflationDelta || 0)),
    });
  }

  /** Tableau d'amortissement de dette unique avec différé. */
  function computeLoanSchedule(amount, annualRate, durationYears, deferralYears, yearsHorizon) {
    yearsHorizon = yearsHorizon || 10;
    const P0 = Number(amount) || 0;
    const r = (Number(annualRate) || 0) / 12;
    const durMonths = Math.round((Number(durationYears) || 1) * 12);
    const defMonths = Math.round((Number(deferralYears) || 0) * 12);
    const amortMonths = Math.max(1, durMonths - defMonths);

    let balance = P0;
    const monthlyPayment = r > 0 ? (P0 * r) / (1 - Math.pow(1 + r, -amortMonths)) : P0 / amortMonths;

    const monthly = [];
    for (let m = 1; m <= durMonths; m++) {
      const interest = balance * r;
      let principal = 0;
      if (m > defMonths) {
        principal = Math.min(balance, monthlyPayment - interest);
        if (r === 0) principal = monthlyPayment;
      }
      balance = Math.max(0, balance - principal);
      monthly.push({ month: m, interest, principal, payment: interest + principal, balance });
    }

    const annual = [];
    for (let y = 1; y <= yearsHorizon; y++) {
      const slice = monthly.slice((y - 1) * 12, y * 12);
      if (slice.length === 0) {
        annual.push({ year: y, interest: 0, principal: 0, debtService: 0, endingBalance: 0 });
        continue;
      }
      const interest = slice.reduce((s, row) => s + row.interest, 0);
      const principal = slice.reduce((s, row) => s + row.principal, 0);
      annual.push({
        year: y,
        interest,
        principal,
        debtService: interest + principal,
        endingBalance: slice[slice.length - 1].balance,
      });
    }
    return annual;
  }

  /** Consolidé de toutes les dettes du projet. */
  function computeTotalDebtSchedule(project, years) {
    years = years || 10;
    const dAcq = project.financing?.detteAcquisition || {};
    const dTrav = project.financing?.detteTravaux || {};

    const schAcq = computeLoanSchedule(dAcq.amount, dAcq.rate, dAcq.durationYears, dAcq.deferralYears, years);
    const schTrav = computeLoanSchedule(dTrav.amount, dTrav.rate, dTrav.durationYears, dTrav.deferralYears, years);

    return Array.from({ length: years }, (_, i) => {
      const a = schAcq[i] || { interest: 0, principal: 0, debtService: 0, endingBalance: 0 };
      const t = schTrav[i] || { interest: 0, principal: 0, debtService: 0, endingBalance: 0 };
      return {
        year: i + 1,
        interest: a.interest + t.interest,
        principal: a.principal + t.principal,
        debtService: a.debtService + t.debtService,
        endingBalance: a.endingBalance + t.endingBalance,
      };
    });
  }

  /** Cashflow & DFN. */
  function computeCashflow(project, years) {
    years = years || 10;
    const usali = computeUSALI(project, years);
    const debtSch = computeTotalDebtSchedule(project, years);

    let cumulative = 0;
    return usali.map((row, i) => {
      const d = debtSch[i];
      const netCashFlow = row.ebitda - d.debtService;
      cumulative += netCashFlow;
      const dscr = d.debtService > 0 ? row.ebitda / d.debtService : null;
      return {
        year: row.year,
        ebitda: row.ebitda,
        interest: d.interest,
        principal: d.principal,
        debtService: d.debtService,
        endingBalance: d.endingBalance,
        netCashFlow,
        cumulativeCashFlow: cumulative,
        dscr,
      };
    });
  }

  function npv(rate, cashflows) {
    return cashflows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);
  }

  function irr(cashflows) {
    let lo = -0.99, hi = 5.0;
    let fLo = npv(lo, cashflows);
    let fHi = npv(hi, cashflows);
    if (isNaN(fLo) || isNaN(fHi) || fLo * fHi > 0) return null;

    let mid = 0;
    for (let i = 0; i < 100; i++) {
      mid = (lo + hi) / 2;
      const fMid = npv(mid, cashflows);
      if (Math.abs(fMid) < 1e-6) break;
      if (fLo * fMid < 0) { hi = mid; fHi = fMid; } else { lo = mid; fLo = fMid; }
    }
    return mid;
  }

  /** Analyse DCF / Valorisation d'Exit. */
  function computeDCF(project) {
    const exitYear = project.valuation?.exitYear || 10;
    const usali = computeUSALI(project, exitYear);
    const cf = computeCashflow(project, exitYear);
    const uses = computeUsesAndSources(project);
    const equity = uses.equityCalculated;

    const exitEbitda = usali[exitYear - 1]?.ebitda || 0;
    const multiple = project.valuation?.exitMultipleEbitda || 17;
    const exitValue = exitEbitda * multiple;

    const remainingDebt = cf[exitYear - 1]?.endingBalance || 0;
    const netSaleProceeds = Math.max(0, exitValue - remainingDebt);

    const equityCF = [-equity];
    for (let y = 1; y <= exitYear; y++) {
      let flow = cf[y - 1]?.netCashFlow || 0;
      if (y === exitYear) flow += netSaleProceeds;
      equityCF.push(flow);
    }

    return {
      equity,
      exitYear,
      exitEbitda,
      exitValue,
      remainingDebt,
      netSaleProceeds,
      equityCF,
      npv: npv(project.valuation?.discountRate || 0.09, equityCF),
      irr: irr(equityCF),
      usali,
      cf,
    };
  }

  /** Aggrégation globale pour le Portefeuille Consolidé. */
  function computePortfolioConsolidated(projects) {
    if (!projects || projects.length === 0) return null;

    const studiedCount = projects.length;
    const exploitationCount = projects.filter((p) => p.status === "Exploitation").length;
    const conversionRate = studiedCount > 0 ? (exploitationCount / studiedCount) * 100 : 0;

    let totalKeys = 0;
    let weightedOccSum = 0;
    let weightedAdrSum = 0;
    let totalCaConsolidated = 0;
    let totalEquityInvested = 0;
    let totalNetDebt = 0;
    let irrSum = 0;
    let validIrrCount = 0;

    projects.forEach((p) => {
      const keys = Number(p.keys) || 0;
      const params = getEffectiveParams(p);
      const usali = computeUSALI(p, 1);
      const uses = computeUsesAndSources(p);
      const dcf = computeDCF(p);

      totalKeys += keys;
      weightedOccSum += params.occ * keys;
      weightedAdrSum += params.adr * keys;
      totalCaConsolidated += usali[0]?.totalRev || 0;
      totalEquityInvested += uses.equityCalculated;
      totalNetDebt += uses.totalDette;

      if (dcf.irr != null && !isNaN(dcf.irr)) {
        irrSum += dcf.irr;
        validIrrCount++;
      }
    });

    return {
      studiedCount,
      exploitationCount,
      conversionRate,
      totalKeys,
      avgWeightedOcc: totalKeys > 0 ? weightedOccSum / totalKeys : 0,
      avgWeightedAdr: totalKeys > 0 ? weightedAdrSum / totalKeys : 0,
      totalCaConsolidated,
      totalEquityInvested,
      totalNetDebt,
      avgPortfolioIrr: validIrrCount > 0 ? irrSum / validIrrCount : null,
    };
  }

  return {
    computeUsesAndSources,
    computeUSALI,
    computeLoanSchedule,
    computeTotalDebtSchedule,
    computeCashflow,
    computeDCF,
    computePortfolioConsolidated,
    getEffectiveParams,
    npv,
    irr,
  };
})();
