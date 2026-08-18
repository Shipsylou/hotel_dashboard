/* ============================================================================
   ENGINE.JS — Moteur de calcul financier hôtelier
   USALI P&L · Amortissement · Cashflow · DCF/TRI · Sensibilité · Indices marché
   ============================================================================ */
window.App = window.App || {};

App.Engine = (function () {
  "use strict";

  const DAYS = 365;

  /** Fusionne les paramètres de base avec les deltas du scénario actif. */
  function getEffectiveParams(project) {
    const base = project.params;
    const scn = (project.scenarios && project.scenarios[project.activeScenario]) || { occDelta: 0, adrDelta: 0, costInflationDelta: 0 };
    return Object.assign({}, base, {
      occ: clamp01(base.occ + (scn.occDelta || 0)),
      adr: Math.max(0, base.adr * (1 + (scn.adrDelta || 0))),
      costInflation: Math.max(0, base.costInflation + (scn.costInflationDelta || 0)),
    });
  }

  function clamp01(v) {
    return Math.min(1, Math.max(0, v));
  }

  /** Calcule le compte de résultat USALI simplifié sur N années. */
  function computeUSALI(project, years) {
    years = years || 10;
    const p = getEffectiveParams(project);
    const keys = Number(project.keys) || 0;
    const rows = [];

    for (let y = 1; y <= years; y++) {
      const rampMult = p.rampUp[y - 1] != null ? p.rampUp[y - 1] : 1;
      const infRev = Math.pow(1 + p.revInflation, y - 1);
      const infCost = Math.pow(1 + p.costInflation, y - 1);

      const occ = clamp01(p.occ * rampMult);
      const adr = p.adr * infRev;
      const revpar = occ * adr;

      const roomsRev = keys * DAYS * occ * adr;
      const fbRev = roomsRev * p.fbPct;
      const otherRev = roomsRev * p.otherPct;
      const totalRev = roomsRev + fbRev + otherRev;

      const roomsExp = roomsRev * p.roomsExpPct;
      const fbExp = fbRev * p.fbExpPct;
      const otherExp = otherRev * p.otherExpPct;
      const totalDeptExp = roomsExp + fbExp + otherExp;

      const deptProfit = totalRev - totalDeptExp;

      const ag = totalRev * p.agPct * infCost / infRev; // charges indexées coûts, revenu indexé CA
      const sm = totalRev * p.smPct * infCost / infRev;
      const pom = totalRev * p.pomPct * infCost / infRev;
      const utilities = totalRev * p.utilitiesPct * infCost / infRev;
      const undistributed = ag + sm + pom + utilities;

      const gop = deptProfit - undistributed;
      const gopPct = totalRev > 0 ? gop / totalRev : 0;

      const mgmtFee = totalRev * p.mgmtFeePct;
      const propertyTax = totalRev * p.propertyTaxPct * infCost / infRev;
      const insurance = totalRev * p.insurancePct * infCost / infRev;
      const ffeReserve = totalRev * (project.capex && project.capex.ffePctOverride != null ? project.capex.ffePctOverride : p.ffePct);
      const nonOpTotal = mgmtFee + propertyTax + insurance + ffeReserve;

      const ebitda = gop - nonOpTotal;
      const ebitdaPct = totalRev > 0 ? ebitda / totalRev : 0;

      rows.push({
        year: y, occ, adr, revpar,
        roomsRev, fbRev, otherRev, totalRev,
        roomsExp, fbExp, otherExp, totalDeptExp, deptProfit,
        ag, sm, pom, utilities, undistributed,
        gop, gopPct,
        mgmtFee, propertyTax, insurance, ffeReserve, nonOpTotal,
        ebitda, ebitdaPct,
      });
    }
    return rows;
  }

  /** Tableau d'amortissement mensuel puis agrégation annuelle, avec différé. */
  function computeAmortization(financing, years) {
    years = years || 10;
    const P0 = Number(financing.loanAmount) || 0;
    const annualRate = Number(financing.rate) || 0;
    const monthlyRate = annualRate / 12;
    const durationMonths = Math.round((Number(financing.durationYears) || 1) * 12);
    const deferralMonths = Math.round((Number(financing.deferralYears) || 0) * 12);
    const amortMonths = Math.max(1, durationMonths - deferralMonths);

    let balance = P0;
    const monthlyPayment =
      monthlyRate > 0
        ? (P0 * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -amortMonths))
        : P0 / amortMonths;

    const monthly = [];
    for (let m = 1; m <= durationMonths; m++) {
      let interest = balance * monthlyRate;
      let principal = 0;
      if (m <= deferralMonths) {
        // Différé : intérêts seuls, pas d'amortissement du capital
        principal = 0;
      } else {
        principal = Math.min(balance, monthlyPayment - interest);
        if (monthlyRate === 0) principal = monthlyPayment;
      }
      balance = Math.max(0, balance - principal);
      monthly.push({ month: m, interest, principal, payment: interest + principal, balance });
    }

    // Agrégation annuelle sur l'horizon demandé
    const annual = [];
    for (let y = 1; y <= years; y++) {
      const slice = monthly.slice((y - 1) * 12, y * 12);
      if (slice.length === 0) {
        annual.push({ year: y, interest: 0, principal: 0, debtService: 0, endingBalance: 0 });
        continue;
      }
      const interest = slice.reduce((s, r) => s + r.interest, 0);
      const principal = slice.reduce((s, r) => s + r.principal, 0);
      annual.push({
        year: y,
        interest,
        principal,
        debtService: interest + principal,
        endingBalance: slice[slice.length - 1].balance,
      });
    }
    return { monthly, annual, monthlyPayment };
  }

  /** Projection de trésorerie sur N années intégrant CAPEX lourds et dette. */
  function computeCashflow(project, years) {
    years = years || 10;
    const usali = computeUSALI(project, years);
    const amort = computeAmortization(project.financing, years);
    const schedule = (project.capex && project.capex.schedule) || [];

    let cumulative = 0;
    const rows = usali.map((row, idx) => {
      const y = row.year;
      const capexHeavy = schedule.filter((c) => Number(c.year) === y).reduce((s, c) => s + Number(c.amount || 0), 0);
      const debtRow = amort.annual[idx] || { debtService: 0, interest: 0, principal: 0, endingBalance: 0 };
      const netCashFlow = row.ebitda - debtRow.debtService - capexHeavy;
      cumulative += netCashFlow;
      const dscr = debtRow.debtService > 0 ? row.ebitda / debtRow.debtService : null;
      return {
        year: y,
        ebitda: row.ebitda,
        capexHeavy,
        interest: debtRow.interest,
        principal: debtRow.principal,
        debtService: debtRow.debtService,
        endingBalance: debtRow.endingBalance,
        netCashFlow,
        cumulativeCashFlow: cumulative,
        dscr,
      };
    });
    return rows;
  }

  /** VAN générique. cashflows[0] = flux à t0 (généralement négatif). */
  function npv(rate, cashflows) {
    return cashflows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);
  }

  /** TRI par dichotomie (robuste pour flux -/+/+/.../+). Retourne null si non résolu. */
  function irr(cashflows) {
    let lo = -0.9999, hi = 5; // -99.99% à +500%
    let fLo = npv(lo, cashflows);
    let fHi = npv(hi, cashflows);
    if (isNaN(fLo) || isNaN(fHi)) return null;
    if (fLo * fHi > 0) {
      // Pas de racine détectée sur l'intervalle : recherche élargie
      hi = 20;
      fHi = npv(hi, cashflows);
      if (fLo * fHi > 0) return null;
    }
    let mid = 0;
    for (let i = 0; i < 200; i++) {
      mid = (lo + hi) / 2;
      const fMid = npv(mid, cashflows);
      if (Math.abs(fMid) < 1e-6) break;
      if (fLo * fMid < 0) {
        hi = mid;
        fHi = fMid;
      } else {
        lo = mid;
        fLo = fMid;
      }
    }
    return mid;
  }

  /** Délai de récupération (payback), interpolé en années. */
  function paybackPeriod(cashflows) {
    let cumulative = cashflows[0];
    for (let t = 1; t < cashflows.length; t++) {
      const prev = cumulative;
      cumulative += cashflows[t];
      if (prev < 0 && cumulative >= 0) {
        const frac = -prev / cashflows[t];
        return t - 1 + frac;
      }
    }
    return null; // jamais récupéré sur l'horizon
  }

  /** Analyse DCF complète côté equity, avec valeur de sortie au taux de capitalisation. */
  function computeDCF(project) {
    const exitYear = project.valuation.exitYear || 10;
    const horizon = Math.max(exitYear, 10);
    const usali = computeUSALI(project, horizon);
    const cashflow = computeCashflow(project, horizon);
    const equity = Number(project.financing.equity) || 0;
    const discountRate = Number(project.valuation.discountRate) || 0.09;
    const exitCapRate = Number(project.valuation.exitCapRate) || 0.07;

    const exitRow = usali[exitYear - 1];
    const exitEbitda = exitRow ? exitRow.ebitda : 0;
    const exitValue = exitCapRate > 0 ? exitEbitda / exitCapRate : 0;
    const remainingDebt = cashflow[exitYear - 1] ? cashflow[exitYear - 1].endingBalance : 0;
    const netSaleProceeds = Math.max(0, exitValue - remainingDebt);

    const equityCF = [-equity];
    for (let y = 1; y <= exitYear; y++) {
      let cf = cashflow[y - 1] ? cashflow[y - 1].netCashFlow : 0;
      if (y === exitYear) cf += netSaleProceeds;
      equityCF.push(cf);
    }

    return {
      exitYear,
      exitEbitda,
      exitValue,
      remainingDebt,
      netSaleProceeds,
      equityCF,
      npv: npv(discountRate, equityCF),
      irr: irr(equityCF),
      payback: paybackPeriod(equityCF),
      usali,
      cashflow,
    };
  }

  /** Matrice de sensibilité TO x ADR sur l'EBITDA / DSCR de l'année stabilisée. */
  function computeSensitivity(project, occDeltas, adrDeltas) {
    occDeltas = occDeltas || [-0.10, -0.05, 0, 0.05, 0.10];
    adrDeltas = adrDeltas || [-0.10, -0.05, 0, 0.05, 0.10];
    // Année stabilisée = première année où le ramp-up atteint 1 (ou dernière année)
    const rampUp = project.params.rampUp || [1];
    let stableYearIdx = rampUp.findIndex((r) => r >= 1);
    if (stableYearIdx === -1) stableYearIdx = rampUp.length - 1;

    const amort = computeAmortization(project.financing, stableYearIdx + 1);
    const debtService = (amort.annual[stableYearIdx] || { debtService: 0 }).debtService;

    const matrix = occDeltas.map((dOcc) => {
      return adrDeltas.map((dAdr) => {
        const clone = JSON.parse(JSON.stringify(project));
        clone.params.occ = clamp01(project.params.occ + dOcc);
        clone.params.adr = Math.max(0, project.params.adr * (1 + dAdr));
        const usali = computeUSALI(clone, stableYearIdx + 1);
        const row = usali[stableYearIdx];
        const dscr = debtService > 0 ? row.ebitda / debtService : null;
        return { occ: row.occ, adr: row.adr, ebitda: row.ebitda, dscr };
      });
    });
    return { occDeltas, adrDeltas, stableYear: stableYearIdx + 1, matrix };
  }

  /** Indices de marché MPI / ARI / RGI comparés au CompSet de la même ville. */
  function computeMarketIndices(project) {
    const p = getEffectiveParams(project);
    const comps = (project.compset || []).filter(
      (c) => !project.city || (c.city || "").trim().toLowerCase() === project.city.trim().toLowerCase()
    );
    if (comps.length === 0) return null;
    const avgOcc = comps.reduce((s, c) => s + Number(c.occ || 0), 0) / comps.length;
    const avgAdr = comps.reduce((s, c) => s + Number(c.adr || 0), 0) / comps.length;
    const avgRevpar = comps.reduce((s, c) => s + Number(c.revpar || c.occ * c.adr || 0), 0) / comps.length;
    const revpar = p.occ * p.adr;
    return {
      avgOcc, avgAdr, avgRevpar, revpar,
      count: comps.length,
      mpi: avgOcc > 0 ? (p.occ / avgOcc) * 100 : null,
      ari: avgAdr > 0 ? (p.adr / avgAdr) * 100 : null,
      rgi: avgRevpar > 0 ? (revpar / avgRevpar) * 100 : null,
    };
  }

  /** Réserve FF&E annuelle (montant €) sur N années. */
  function computeFFESchedule(project, years) {
    years = years || 10;
    const usali = computeUSALI(project, years);
    return usali.map((r) => ({ year: r.year, totalRev: r.totalRev, ffeReserve: r.ffeReserve }));
  }

  return {
    getEffectiveParams,
    computeUSALI,
    computeAmortization,
    computeCashflow,
    computeDCF,
    computeSensitivity,
    computeMarketIndices,
    computeFFESchedule,
    npv,
    irr,
    paybackPeriod,
  };
})();
