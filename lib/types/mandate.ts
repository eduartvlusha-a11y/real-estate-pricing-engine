export type MandateRecord = {
  // 🔹 Identification
  id: string;
  createdAt: string;

  // 🔹 Property context
  property: {
    emv: number;
    sellerAskingPrice: number;
    deviation: number;
    marketHeat: number;
  };

  // 🔹 Decision output
  decision: {
    recommendedPath: "seller_path" | "strategic_path";

    sellerPath: {
      entryPrice: number;
      correctionProbability: number;
      valueErosionLow: number;
      valueErosionHigh: number;
      negotiationLeverage: string;
      timePressureRisk: string;
    };

    strategicPath: {
      entryPrice: number;
      correctionProbability: number;
      valueErosionLow: number;
      valueErosionHigh: number;
      negotiationLeverage: string;
      timePressureRisk: string;
    };
  };

  // 🔹 Market behavior
  risk: {
    correctionProbability: {
      p30: number;
      p60: number;
      p90: number;
    };

    valueErosion: {
      low: number;
      high: number;
    };
  };

  // 🔹 Seller psychology
  seller: {
    psychology: string | null;
  };

  // 🔹 Timeline
  timeline: string[];

  // 🔹 Broker layer (this is GOLD for monetization)
  broker: {
    strategy: string;
    summary: string;
    brokerageName?: string;
  };
};