export type MandatePath = {
  entryPrice: number;
  correctionProbability: number;
  valueErosion: number;
  negotiationLeverage: number;
  timePressureRisk: number;
};

export type MandateDecision = {
  marketContext: {
    emv: number;
    sellerAskingPrice: number;
    deviationFromEmv: number;
  };
  sellerPath: MandatePath;
  strategicPath: MandatePath;
  recommendedPath: "sellerPath" | "strategicPath";
  correctionProbability: {
    sellerPath: number;
    strategicPath: number;
  };
  valueErosion: {
    sellerPath: number;
    strategicPath: number;
  };
  sellerPsychology: {
    pricingPosition: "above_emv" | "at_emv" | "below_emv";
  };
  timeline: {
    sellerPath: string;
    strategicPath: string;
  };
  brokerRecommendation: {
    summary: string;
  };
};

export function buildMandateDecision(result: any, seller: number, emv: number) {
  const correctionProbability = result.correctionProbability ?? {
    probability30: 0,
    probability60: 0,
    probability90: 0
  };

  const sellerPath = {
    entryPrice: seller,
    correctionProbability: correctionProbability.probability60,
    valueErosionLow: result.valueLossLow ?? 0,
    valueErosionHigh: result.valueLossHigh ?? 0,

    negotiationLeverage:
      result.deviation <= 3 ? "Strong" :
      result.deviation <= 7 ? "Moderate" :
      "Weak",

    timePressureRisk:
      result.marketHeat >= 70 ? "Low" :
      result.marketHeat >= 50 ? "Moderate" :
      "High"
  };

  const strategicPath = {
    entryPrice: result.strategicEntryPrice ?? emv,
    correctionProbability: correctionProbability.probability60,
    valueErosionLow: 0,
    valueErosionHigh: 0,
    negotiationLeverage: "Strong",
    timePressureRisk: "Low"
  };

  const recommendedPath =
    result.deviation <= 5 ? "seller_path" : "strategic_path";

  // 🧠 NEW — CRM READY STRUCTURE
  const decision = {
    // 🔹 core (UI already uses this)
    sellerPath,
    strategicPath,
    recommendedPath,

    // 🔹 structured context (NEW)
    marketContext: {
      emv,
      sellerAskingPrice: seller,
      deviation: result.deviation,
      marketHeat: result.marketHeat
    },

    correctionProbability: {
      p30: correctionProbability.probability30,
      p60: correctionProbability.probability60,
      p90: correctionProbability.probability90
    },

    valueErosion: {
      low: result.valueLossLow ?? 0,
      high: result.valueLossHigh ?? 0
    },

    sellerPsychology: result.sellerReport?.sellerPsychology ?? null,

    timeline: result.sellerReport?.timeline ?? [],

    brokerRecommendation: {
      strategy: result.strategy,
      summary: result.executiveSummary
    }
  };

  return decision;
}