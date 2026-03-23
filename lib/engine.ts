export type EngineInput = {
  emv: number;
  seller: number;

  // legacy categorical inputs (keep for compatibility during transition)
  marketTemp?: "hot" | "neutral" | "slow";
  competition?: "low" | "medium" | "high";
  absorption?: "fast" | "normal" | "slow";
  rateClimate?: "falling" | "stable" | "rising";
  microDemand?: "high" | "medium" | "low";
  urgency?: "low" | "medium" | "high";

  // new formal market heat inputs (0-100 deterministic scale)
  demandIndex?: number;
  absorptionRate?: number;
  competitionIndex?: number;
  rateClimateIndex?: number;
  microDemandIndex?: number;
  supplyPressure?: number;

  // optional OS inputs (phase 1.x)
  comparablesCount?: number;
  dataFreshnessDays?: number;
  avgDaysOnMarket?: number;
  daysOnMarket?: number;
};

function score(value: string, map: any) {
  return map[value] ?? 60;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function computeMarketHeatComposite(input: EngineInput) {

  const preset = (() => {
    if (input.marketTemp === "hot") {
      return {
        demandIndex: 90,
        absorptionRate: 90,
        competitionIndex: 70,
        rateClimateIndex: 70,
        microDemandIndex: 85,
        supplyPressure: 40
      };
    }

    if (input.marketTemp === "slow") {
      return {
        demandIndex: 40,
        absorptionRate: 40,
        competitionIndex: 85,
        rateClimateIndex: 40,
        microDemandIndex: 45,
        supplyPressure: 80
      };
    }

    return {
      demandIndex: 60,
      absorptionRate: 60,
      competitionIndex: 60,
      rateClimateIndex: 60,
      microDemandIndex: 60,
      supplyPressure: 60
    };
  })();

  const demandIndex = input.demandIndex ?? preset.demandIndex;
const absorptionRate = input.absorptionRate ?? preset.absorptionRate;
const competitionIndex = input.competitionIndex ?? preset.competitionIndex;
const rateClimateIndex = input.rateClimateIndex ?? preset.rateClimateIndex;
const microDemandIndex = input.microDemandIndex ?? preset.microDemandIndex;
const supplyPressure = input.supplyPressure ?? preset.supplyPressure;

  // composite deterministic score
  const marketHeatScore = Math.round(
  demandIndex * 0.32 +
  absorptionRate * 0.26 +
  (100 - competitionIndex) * 0.16 +
  rateClimateIndex * 0.10 +
  microDemandIndex * 0.10 +
  (100 - supplyPressure) * 0.06
);

  return clamp(marketHeatScore, 0, 100);
}

function computeTimePenalty(
  daysOnMarket: number,
  avgDaysOnMarket: number,
  marketHeat: number
) {
  const domRatio = daysOnMarket / avgDaysOnMarket;

  let stage: "fresh" | "normal" | "stale" | "aged";

  if (daysOnMarket <= 7) stage = "fresh";
  else if (domRatio < 1) stage = "normal";
  else if (domRatio < 1.7) stage = "stale";
  else stage = "aged";

  const basePenalty =
    stage === "fresh" ? 0 :
    stage === "normal" ? 0.02 :
    stage === "stale" ? 0.05 :
    0.09;

  // heat=100 => less penalty, heat=0 => more penalty (deterministic linear)
  const heatAdjustment = 1 - (marketHeat - 50) / 200;

  const penaltyPct = clamp(basePenalty * heatAdjustment, 0, 0.18);
  const multiplier = 1 + penaltyPct;

  return {
    stage,
    domRatio: Number(domRatio.toFixed(2)),
    penaltyPct: Number(penaltyPct.toFixed(3)),
    multiplier: Number(multiplier.toFixed(3)),
  };
}

function computeCorrectionProbability(
  deviation: number,
  domRatio: number,
  marketHeat: number,
  positioningClass: string
) {
  let baseRisk = deviation * 4;

  if (positioningClass === "Over-ambitious") baseRisk += 10;
  if (positioningClass === "Market-blocking") baseRisk += 20;

  const domPressure = domRatio * 15;

  const heatAdjustment =
    marketHeat >= 75 ? -10 :
    marketHeat >= 55 ? 0 :
    10;

  const probability30 = clamp(baseRisk * 0.6 + domPressure + heatAdjustment, 5, 95);
  const probability60 = clamp(baseRisk * 0.9 + domPressure * 1.2 + heatAdjustment, 10, 98);
  const probability90 = clamp(baseRisk * 1.2 + domPressure * 1.4 + heatAdjustment, 15, 99);

  return {
    probability30: Math.round(probability30),
    probability60: Math.round(probability60),
    probability90: Math.round(probability90)
  };
}
function computePricingGuardrail(
  daysOnMarket: number,
  domRatio: number,
  deviation: number
) {

  let guardrailStage: "stable" | "watch" | "action" | "critical";

  if (daysOnMarket <= 14 && deviation <= 3) {
    guardrailStage = "stable";
  } else if (domRatio < 1 && deviation <= 5) {
    guardrailStage = "watch";
  } else if (domRatio < 1.7 && deviation <= 8) {
    guardrailStage = "action";
  } else {
    guardrailStage = "critical";
  }

  return {
    stage: guardrailStage
  };
}function buildSellerInsight(
  deviation: number,
  probability60: number,
  valueLossLow: number,
  valueLossHigh: number
) {
  return `Pricing the property ${deviation.toFixed(
    1
  )}% above estimated market value creates an estimated ${probability60}% probability of price correction within 60 days. Similar listings typically experience value erosion between €${valueLossLow.toLocaleString()} and €${valueLossHigh.toLocaleString()}.`;
}

function detectSellerObjection(
  deviation: number,
  positioningClass: string,
  marketHeat: number
) {

  if (deviation <= 2) {
    return "none";
  }

  if (deviation <= 5) {
    return "emotional_anchor";
  }

  if (deviation <= 8) {
    return "overconfidence";
  }

  if (deviation <= 12) {
    return marketHeat >= 60
      ? "neighbour_sale_bias"
      : "market_denial";
  }

  return "market_denial";
}


function toNumber(value: any, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function computeMandateDecision(
  sellerPrice: number,
  strategicEntryPrice: number,
  deviation: number,
  correctionProbability: any,
  valueLossLow: number,
  valueLossHigh: number,
  marketHeat: number
) {

  const sellerPath = {
    entryPrice: sellerPrice,
    correctionProbability: correctionProbability.probability60,
    valueErosionLow: valueLossLow,
    valueErosionHigh: valueLossHigh,
    negotiationLeverage: deviation <= 3 ? "Strong" : deviation <= 7 ? "Moderate" : "Weak",
    timePressureRisk:
      marketHeat >= 70 ? "Low"
      : marketHeat >= 50 ? "Moderate"
      : "High"
  };

  const strategicPath = {
    entryPrice: strategicEntryPrice,
    correctionProbability: Math.max(5, correctionProbability.probability60 - 25),
    valueErosionLow: 0,
    valueErosionHigh: Math.round(valueLossLow * 0.3),
    negotiationLeverage: "Strong",
    timePressureRisk:
      marketHeat >= 70 ? "Very Low"
      : marketHeat >= 50 ? "Low"
      : "Moderate"
  };

  const recommendedPath =
    deviation <= 3 ? "seller_path"
    : deviation <= 6 ? "strategic_path"
    : "strategic_path";

  return {
    sellerPath,
    strategicPath,
    recommendedPath
  };
}

function normalizeEngineInput(input: EngineInput) {
  const errors: string[] = [];

  const emv = toNumber(input.emv, 0);
  const seller = toNumber(input.seller, 0);

  if (emv <= 0) errors.push("EMV must be greater than 0.");
  if (seller <= 0) errors.push("Seller price must be greater than 0.");

  // Optional fields (safe defaults)
  const comparablesCount = clamp(toNumber(input.comparablesCount ?? 6, 6), 0, 50);
  const dataFreshnessDays = clamp(toNumber(input.dataFreshnessDays ?? 90, 90), 0, 365);
  const avgDaysOnMarket = clamp(toNumber(input.avgDaysOnMarket ?? 60, 60), 1, 365);
  const daysOnMarket = clamp(toNumber(input.daysOnMarket ?? 0, 0), 0, 3650);

  // --- Time Penalty validation ---
if (daysOnMarket > 0 && avgDaysOnMarket <= 0) {
  errors.push("avgDaysOnMarket must be greater than 0 when daysOnMarket is provided.");
}

  return {
    normalized: {
      ...input,
      emv,
      seller,
      comparablesCount,
      dataFreshnessDays,
      avgDaysOnMarket,
      daysOnMarket
    },
    errors,
    isValid: errors.length === 0
  };
}

export function runEngine(input: EngineInput) {
  const { normalized, errors, isValid } = normalizeEngineInput(input);

  // If invalid, return safe outputs (no NaN) + errors
  if (!isValid) {
    return {
      msi: 60,
      positioningScore: 50,
      positioningClass: "Insufficient data",
      deviation: 0,
      correctionLow: 0,
      correctionHigh: 0,
      valueLossLow: 0,
      valueLossHigh: 0,
      strategy: "Input data is incomplete. Please review EMV and asking price.",
      riskLevel: "Low",
      commissionFull: 0,
      commissionReduced: 0,
      commissionLoss: 0,
      executiveSummary: `Insufficient input data to compute the report.\n\nIssues:\n- ${errors.join("\n- ")}`,
      strategicEntryPrice: 0,
      confidenceLevel: "Low" as const,
      errors,
      isValid
    };
  }

  // from here on, use normalized values
  input = normalized;

  // --- MARKET SCORING ---
  const tempScore = score(input.marketTemp, { hot: 100, neutral: 60, slow: 20 });
  const compScore = score(input.competition, { low: 100, medium: 60, high: 20 });
  const absScore = score(input.absorption, { fast: 100, normal: 60, slow: 20 });
  const rateScore = score(input.rateClimate, { falling: 100, stable: 60, rising: 20 });
  const microScore = score(input.microDemand, { high: 100, medium: 60, low: 20 });

  const msi = computeMarketHeatComposite(input);
const roundedMSI = msi;

// --- MARKET HEAT (Composite Model) ---
const marketHeat = computeMarketHeatComposite(input);

  // --- PRICE DEVIATION ---
  const deviationRaw =
    ((input.seller - input.emv) / input.emv) * 100;

  const deviation = parseFloat(deviationRaw.toFixed(1));
  const deviationPositive = Math.max(0, deviation);


// --- POSITIONING ALIGNMENT SCORE (PAS) ---
const positioningRawPAS = 100 - deviationPositive * 2.2;
const positioningScore = Math.round(clamp(positioningRawPAS, 10, 100));


// --- POSITIONING CLASS (Adaptive) ---
let mild: number;
let moderate: number;

if (roundedMSI >= 75) {
  mild = 6;
  moderate = 10;
} else if (roundedMSI >= 55) {
  mild = 4;
  moderate = 8;
} else {
  mild = 3;
  moderate = 6;
}

let positioningClass: string;

if (deviationPositive <= 0) positioningClass = "Market-aligned";
else if (deviationPositive <= mild) positioningClass = "Slightly ambitious";
else if (deviationPositive <= moderate) positioningClass = "Over-ambitious";
else positioningClass = "Market-blocking";

  // --- STRATEGIC ENTRY PRICE MODEL ---
const strategicEntryAdjustment =
  roundedMSI >= 75 ? 0.02 :
  roundedMSI >= 55 ? 0.01 :
  0;

const strategicEntryPrice = Math.round(
  input.emv * (1 + strategicEntryAdjustment)
);

  // --- CONFIDENCE LEVEL ---
  const comps = input.comparablesCount ?? 6;
  const freshness = input.dataFreshnessDays ?? 90;

  let confidenceLevel: "High" | "Medium" | "Low";

  if (comps >= 8 && freshness <= 60) confidenceLevel = "High";
  else if (comps >= 4 && freshness <= 120) confidenceLevel = "Medium";
  else confidenceLevel = "Low";

  // --- SENSITIVITY MODEL ---
  const sensitivity =
    roundedMSI >= 80 ? 0.8 :
    roundedMSI >= 65 ? 1.0 :
    roundedMSI >= 50 ? 1.2 :
    roundedMSI >= 35 ? 1.5 : 1.8;

  const behavioral =
    deviationPositive <= 2 ? 1.0 :
    deviationPositive <= 5 ? 1.2 :
    deviationPositive <= 8 ? 1.5 : 1.9;

  const erm = sensitivity * behavioral;

  // --- CORRECTION MODEL ---
  const correctionLow = clamp(deviationPositive * erm * 0.35, 1.5, 7);
  const correctionHigh = clamp(deviationPositive * erm * 0.55, 2.5, 10);

  // --- FINANCIAL IMPACT ---
  const valueLossLow = Math.round(input.emv * (correctionLow / 100));
  const valueLossHigh = Math.round(input.emv * (correctionHigh / 100));

  // --- TIME PENALTY LAYER ---
const timePenalty = computeTimePenalty(
  input.daysOnMarket ?? 0,
  input.avgDaysOnMarket ?? 60,
  marketHeat
);

// --- TIME ADJUSTED CORRECTION ---
const correctionLowTimeAdjusted =
  correctionLow * timePenalty.multiplier;

const correctionHighTimeAdjusted =
  correctionHigh * timePenalty.multiplier;

const valueLossLowTimeAdjusted =
  Math.round(input.emv * (correctionLowTimeAdjusted / 100));

const valueLossHighTimeAdjusted =
  Math.round(input.emv * (correctionHighTimeAdjusted / 100));

  // --- CORRECTION PROBABILITY MODEL ---
const correctionProbability = computeCorrectionProbability(
  deviationPositive,
  timePenalty.domRatio,
  marketHeat,
  positioningClass
);

// --- PRICING GUARDRAIL ---
const pricingGuardrail = computePricingGuardrail(
  input.daysOnMarket ?? 0,
  timePenalty.domRatio,
  deviationPositive
);

// --- SELLER INSIGHT ---
const sellerInsight = buildSellerInsight(
  deviationPositive,
  correctionProbability.probability60,
  valueLossLow,
  valueLossHigh
);

const timeline = (() => {
  if (deviationPositive <= 3) {
    return [
      "Week 1–2 → Strong buyer activity",
      "Week 3–4 → Competitive positioning maintained",
      "Week 5–8 → Stable negotiation environment"
    ];
  }

  if (deviationPositive <= 7) {
    return [
      "Week 1–2 → Initial interest but selective buyers",
      "Week 3–4 → Buyer hesitation increases",
      "Week 5–8 → Pressure for price adjustment"
    ];
  }

  if (deviationPositive <= 12) {
    return [
      "Week 1–2 → Limited traction",
      "Week 3–4 → Listing starts to stagnate",
      "Week 5–8 → Strong correction pressure builds"
    ];
  }

  return [
    "Week 1–2 → Low engagement",
    "Week 3–4 → Market resistance",
    "Week 5–8 → Listing becomes stale",
    "After 60 days → Loss of market credibility"
  ];
})();

// --- SELLER PSYCHOLOGY SIGNAL ---
const sellerObjectionType = detectSellerObjection(
  deviationPositive,
  positioningClass,
  marketHeat
);

  // --- STRATEGY RECOMMENDATION ---
  let strategy: string;

  if (roundedMSI >= 75) {
    strategy = "Scarcity-driven entry positioning recommended.";
  } else if (roundedMSI >= 55) {
    strategy = "Structured strategic entry positioning recommended.";
  } else {
    strategy = "Defensive pricing discipline recommended.";
  }

  // --- MANDATE DECISION ENGINE ---
const mandateDecision = computeMandateDecision(
  input.seller,
  strategicEntryPrice,
  deviationPositive,
  correctionProbability,
  valueLossLow,
  valueLossHigh,
  marketHeat
);

  // --- RISK LEVEL ---
  let riskLevel: string;

  if (deviationPositive <= 2) {
    riskLevel = "Low";
  } else if (deviationPositive <= 5) {
    riskLevel = "Moderate";
  } else if (deviationPositive <= 8) {
    riskLevel = "Elevated";
  } else {
    riskLevel = "High";
  }

  // --- COMMISSION DEFENSE SIMULATION ---
const commissionFull = input.emv * 0.03;
const commissionReduced = input.emv * 0.025;
const commissionLoss = Math.round(commissionFull - commissionReduced);

  // --- EXECUTIVE MANDATE SUMMARY ---
let executiveSummary: string;

executiveSummary = `
Under current market conditions (MSI ${roundedMSI}), pricing ${deviationPositive.toFixed(
  1
)}% above estimated market value increases correction probability.

Projected value erosion is estimated between €${valueLossLow.toLocaleString()} and €${valueLossHigh.toLocaleString()}, materially impacting negotiation leverage.

Commission sensitivity analysis indicates potential erosion of €${commissionLoss.toLocaleString()} under reduced fee scenarios.

A ${strategy.toLowerCase()} is advised to preserve pricing credibility, protect commission integrity, and strengthen mandate positioning.
`;

  

  return {
  msi: roundedMSI,
  positioningScore,
  positioningClass,
  deviation,
  correctionLow: parseFloat(correctionLow.toFixed(1)),
  correctionHigh: parseFloat(correctionHigh.toFixed(1)),
  valueLossLow,
  valueLossHigh,
  strategy,
  riskLevel,
  commissionFull: Math.round(commissionFull),
  commissionReduced: Math.round(commissionReduced),
  commissionLoss,
  executiveSummary,
  strategicEntryPrice,
    timePenalty,
  correctionLowTimeAdjusted: Number(correctionLowTimeAdjusted.toFixed(1)),
  correctionHighTimeAdjusted: Number(correctionHighTimeAdjusted.toFixed(1)),
  valueLossLowTimeAdjusted,
  valueLossHighTimeAdjusted,
  correctionProbability,
  pricingGuardrail,
    errors,
  isValid,
  confidenceLevel,
  marketHeat,
  sellerReport: {
    timeline,
    sellerObjectionType,
     marketSnapshot: {
    marketHeat,
    msi: roundedMSI,
    avgDaysOnMarket: input.avgDaysOnMarket
  },

  pricingPosition: {
    emv: input.emv,
    askingPrice: input.seller,
    deviationPercent: deviationPositive,
    positioningClass
  },

  marketReaction: {
    probability30: correctionProbability.probability30,
    probability60: correctionProbability.probability60,
    probability90: correctionProbability.probability90
  },

  financialImpact: {
    valueLossLow,
    valueLossHigh
  },

  strategicPositioning: {
    strategicEntryPrice
  },

  disciplineSignal: {
    guardrail: pricingGuardrail.stage
  },

  sellerPsychology: {
  objectionType: sellerObjectionType
},
insight: sellerInsight
},
  

};

}