"use client";

import { useState } from "react";
import { runEngine } from "@/lib/engine";
import { buildMandateDecision } from "@/lib/decision-engine";

type Step =
  | "market"
  | "position"
  | "reaction"
  | "impact"
  | "strategy"
  | "decision";

const STEP_ORDER: Step[] = [
  "market",
  "position",
  "reaction",
  "impact",
  "strategy",
  "decision"
];

export default function Home() {
  const [emv, setEmv] = useState(800000);
  const [seller, setSeller] = useState(840000);
  const [brokerName, setBrokerName] = useState("Merz Holding");
  const [step, setStep] = useState<Step>("market");
  const [marketTemp, setMarketTemp] = useState<"hot" | "neutral" | "slow">("neutral");

  const result = runEngine({
    emv,
    seller,
    marketTemp,
    competition: "medium",
    absorption: "normal",
    rateClimate: "stable",
    microDemand: "medium",
    urgency: "medium"
  });

  console.log("MANDATE ENGINE RESULT:", result);

  const hasErrors = result.isValid === false;

  const correctionProbability = result.correctionProbability ?? {
    probability30: 0,
    probability60: 0,
    probability90: 0
  };

  const timePenalty = result.timePenalty ?? {
    stage: "fresh",
    domRatio: 0
  };

  const pricingGuardrail = result.pricingGuardrail ?? {
    stage: "stable"
  };

 const marketHeat = result.marketHeat;

const safeMarketHeat = marketHeat ?? 0;

const marketLabel =
  safeMarketHeat >= 80
    ? "Hot Market"
    : safeMarketHeat >= 60
    ? "Balanced Market"
    : "Cold Market";

const bannerText = (() => {
  if (result.deviation <= 2) {
    return `The property is positioned in line with the market. Current conditions support stable demand and controlled negotiations.`;
  }

  if (result.deviation <= 6) {
    return `The property is slightly above market positioning. Buyer activity will be selective, with a ${correctionProbability.probability60}% probability of price adjustment within 60 days.`;
  }

  if (result.deviation <= 10) {
    return `The property is materially above market expectations. This positioning creates resistance, with a ${correctionProbability.probability60}% probability of correction and increasing time pressure.`;
  }

  return `The property is significantly overpriced relative to current market conditions. Expect low engagement, strong resistance, and a high likelihood (${correctionProbability.probability60}%) of price correction.`;
})();
const sellerPsychology =
  result.sellerReport?.sellerPsychology?.objectionType ?? "none";
const psychologyLabel = (() => {
  if (sellerPsychology === "none") {
    return "Seller expectations are aligned with market conditions, supporting stable demand and clean negotiations.";
  }

  if (sellerPsychology === "emotional_anchor") {
    return (result.marketHeat ?? 0) >= 60
      ? "Seller is anchored to a personal reference point, but current demand may temporarily support this positioning."
      : "Seller is anchored to a personal reference point, which is limiting buyer engagement and will likely delay serious offers.";
  }

  if (sellerPsychology === "overconfidence") {
    return (result.marketHeat ?? 0) >= 60
      ? "Seller is testing the upper boundary of the market, which may hold briefly under current conditions."
      : "Seller is overestimating market tolerance, increasing resistance and weakening negotiation leverage.";
  }

  if (sellerPsychology === "neighbour_sale_bias") {
    return "Seller is influenced by nearby sales that may no longer reflect current market conditions, creating pricing misalignment.";
  }

  if (sellerPsychology === "market_denial") {
    return (result.marketHeat ?? 0) >= 60
      ? "Seller expectations are stretched but partially supported by current market momentum."
      : "Seller expectations are not aligned with current market reality, leading to low traction and extended time on market.";
  }

  return "Seller positioning deviates from current buyer expectations, increasing friction in negotiations.";
})();

 const mandateDecision = buildMandateDecision(result, seller, emv);

  const sellerReport = result.sellerReport ?? {
    marketSnapshot: {
      marketHeat: result.marketHeat ?? result.msi ?? 0,
      msi: result.msi ?? 0,
      avgDaysOnMarket: 0
    },
    pricingPosition: {
      emv,
      askingPrice: seller,
      deviationPercent: result.deviation ?? 0,
      positioningClass: result.positioningClass ?? "N/A"
    },
    marketReaction: {
      probability30: correctionProbability.probability30,
      probability60: correctionProbability.probability60,
      probability90: correctionProbability.probability90
    },
    financialImpact: {
      valueLossLow: result.valueLossLow ?? 0,
      valueLossHigh: result.valueLossHigh ?? 0
    },
    strategicPositioning: {
      strategicEntryPrice: result.strategicEntryPrice ?? 0
    },
    disciplineSignal: {
      guardrail: pricingGuardrail.stage
    },
    insight: ""
  };

  const currentStepIndex = STEP_ORDER.indexOf(step);

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      setStep(STEP_ORDER[nextIndex]);
    }
  };

  const goBack = () => {
    const previousIndex = currentStepIndex - 1;
    if (previousIndex >= 0) {
      setStep(STEP_ORDER[previousIndex]);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F8FA] p-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold">
  Mandate Intelligence – Pricing Engine
</h1>

<p className="text-gray-600 mt-2">
  Win more listings with data-backed pricing decisions.
</p>

<div className="mt-4 flex gap-4 text-sm text-gray-700">

  <div className="bg-white border px-4 py-2 rounded-lg">
    📈 Justify pricing with data
  </div>

  <div className="bg-white border px-4 py-2 rounded-lg">
    🤝 Win seller trust instantly
  </div>

  <div className="bg-white border px-4 py-2 rounded-lg">
    ⚡ Reduce overpricing risk
  </div>

</div>

<p className="text-xs text-gray-500 mt-3">
  Built for real estate brokers to structure pricing conversations and increase mandate conversion.
</p>

          <div className="mt-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">

  <p className="text-sm font-semibold text-blue-800">
    Market Context — {marketLabel}
  </p>

  <p className="text-sm text-blue-900 mt-1">
    {bannerText}
  </p>

  <p className="text-xs text-blue-700 mt-2">
    Seller Signal: {psychologyLabel}
  </p>

</div>

{/* MARKET TIMELINE */}
<div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">

  <h3 className="text-sm text-gray-500 mb-3">
    Market Timeline Projection
  </h3>

  <div className="space-y-2">
    {result.sellerReport?.timeline?.map((item: string, i: number) => (
      <p key={i} className="text-sm text-gray-800">
        {item}
      </p>
    ))}
  </div>

</div>

<div className="flex items-center gap-3 mt-2">
            <p className="text-gray-500">
              Market-based pricing analysis for strategic listing positioning
            </p>

            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                result.confidenceLevel === "High"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : result.confidenceLevel === "Medium"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-gray-50 text-gray-700 border-gray-200"
              }`}
            >
              Data Confidence: {result.confidenceLevel}
            </span>
          </div>
        </div>

        {/* Conversation Flow */}
        <div className="flex gap-6 text-sm font-medium text-gray-600 mb-10">
          {STEP_ORDER.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStep(item)}
              className={`transition ${
                step === item ? "text-black font-bold" : "text-gray-600"
              }`}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 mb-10">
          <h2 className="text-lg font-semibold mb-6 text-gray-800">
            Pricing Context
          </h2>

          <div className="grid grid-cols-2 gap-6">
  <div>
    <label className="text-sm text-gray-500">
      Estimated Market Value (€)
    </label>
    <input
      type="number"
      value={emv}
      onChange={(e) => setEmv(Number(e.target.value))}
      className="mt-2 w-full border rounded-lg p-3"
    />
  </div>

  <div>
    <label className="text-sm text-gray-500">
      Seller Expected Price (€)
    </label>
    <input
      type="number"
      value={seller}
      onChange={(e) => setSeller(Number(e.target.value))}
      className="mt-2 w-full border rounded-lg p-3"
    />
  </div>

  <div>
    <label className="text-sm text-gray-500">
      Market Temperature
    </label>

    <select
      value={marketTemp}
      onChange={(e) => setMarketTemp(e.target.value as any)}
      className="mt-2 w-full border rounded-lg p-3"
    >
      <option value="hot">Hot</option>
      <option value="neutral">Neutral</option>
      <option value="slow">Slow</option>
    </select>
  </div>
</div>
        </div>

        {/* MARKET */}
        {step === "market" && (
          <div className="grid grid-cols-3 gap-8">
            {/* MSI */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8">
              <h3 className="text-sm text-gray-500 mb-2">
                Market Strength Index
              </h3>

              <div
                className={`text-6xl font-bold ${
                  result.msi >= 75
                    ? "text-green-700"
                    : result.msi >= 50
                    ? "text-gray-900"
                    : result.msi >= 35
                    ? "text-amber-600"
                    : "text-red-700"
                }`}
              >
                {result.msi}
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Buyer Leverage</span>
                  <span>Seller Leverage</span>
                </div>

                <div className="relative h-3 bg-gray-200 rounded-full">
                  <div
                    className={`absolute h-3 rounded-full ${
                      result.msi >= 75
                        ? "bg-green-600"
                        : result.msi >= 50
                        ? "bg-gray-800"
                        : result.msi >= 35
                        ? "bg-amber-500"
                        : "bg-red-600"
                    }`}
                    style={{ width: `${result.msi}%` }}
                  />
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Market balance positioning based on composite index.
                </p>
              </div>
            </div>

            {/* Positioning Alignment Score */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8">
              <h3 className="text-sm text-gray-500 mb-2">
                Positioning Alignment Score
              </h3>

              <div
                className={`text-6xl font-bold ${
                  result.msi >= 75
                    ? "text-green-700"
                    : result.msi >= 50
                    ? "text-gray-900"
                    : result.msi >= 35
                    ? "text-amber-600"
                    : "text-red-700"
                }`}
              >
                {result.positioningScore}
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Misaligned</span>
                  <span>Well Aligned</span>
                </div>

                <div className="relative h-3 bg-gray-200 rounded-full">
                  <div
                    className={`absolute h-3 rounded-full ${
                      result.positioningScore >= 80
                        ? "bg-green-600"
                        : result.positioningScore >= 60
                        ? "bg-amber-500"
                        : "bg-red-600"
                    }`}
                    style={{ width: `${result.positioningScore}%` }}
                  />
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Pricing discipline relative to estimated market value.
                </p>
              </div>
            </div>

            {/* Market Snapshot Add-on */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8">
              <h3 className="text-sm text-gray-500 mb-3">
                Market Snapshot
              </h3>

              <p className="text-gray-700">Current market heat:</p>
              <p className="text-2xl font-bold mt-2 text-gray-900">
                {sellerReport.marketSnapshot.marketHeat}
              </p>

              <p className="text-sm text-gray-500 mt-3">
                Guided context for listing conversations.
              </p>
            </div>
          </div>
        )}

        {/* POSITION */}
        {step === "position" && (
          <div className="mt-8 bg-white shadow-sm border border-gray-200 rounded-xl p-8">
            <h3 className="text-sm text-gray-500 mb-6">
              Pricing Position
            </h3>

            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-xs text-gray-500">Estimated Market Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{sellerReport.pricingPosition.emv.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Seller Asking Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{sellerReport.pricingPosition.askingPrice.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Positioning Gap</p>
                <p className="text-2xl font-bold text-red-600">
                  +{sellerReport.pricingPosition.deviationPercent}%
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  {sellerReport.pricingPosition.positioningClass}
                </p>

                <p className="text-sm text-gray-600 mt-2">
                  €
                  {(
                    sellerReport.pricingPosition.askingPrice -
                    sellerReport.pricingPosition.emv
                  ).toLocaleString()}{" "}
                  above market value
                </p>
              </div>
            </div>
          </div>
        )}

        {/* REACTION */}
        {step === "reaction" && (
          <div className="mt-8 bg-white shadow-sm border border-gray-200 rounded-xl p-8">
            <div className="flex items-start justify-between">
              <h3 className="text-sm text-gray-500 mb-4">
                Pricing Risk Overview
              </h3>

              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  result.riskLevel === "Low"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : result.riskLevel === "Moderate"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : result.riskLevel === "Elevated"
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {result.riskLevel} Risk
              </span>
            </div>

            <div className="space-y-3 text-gray-800">
              <p>
                Deviation from market value:{" "}
                <span className="font-semibold">{result.deviation}%</span>
              </p>

              <p>
                Expected correction band:{" "}
                <span className="font-semibold">
                  {result.correctionLow}% – {result.correctionHigh}%
                </span>
              </p>

              <p>
                Probability of correction (30 / 60 / 90 days):{" "}
                <span className="font-semibold">
                  {correctionProbability.probability30}% /{" "}
                  {correctionProbability.probability60}% /{" "}
                  {correctionProbability.probability90}%
                </span>
              </p>

              <p>
                Market pressure stage:{" "}
                <span className="font-semibold uppercase">
                  {String(timePenalty.stage)}
                </span>{" "}
                (DOM ratio {timePenalty.domRatio})
              </p>

              <p className="text-gray-500 text-sm">
                Conservative scenario modeling under current conditions.
              </p>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Pricing discipline signal:
                </span>

                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    pricingGuardrail.stage === "stable"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : pricingGuardrail.stage === "watch"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : pricingGuardrail.stage === "action"
                      ? "bg-orange-50 text-orange-700 border-orange-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {String(pricingGuardrail.stage).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* IMPACT */}
        {step === "impact" && (
          <div className="grid grid-cols-2 gap-8 mt-8">
            {/* Financial Impact */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8">
              <h3 className="text-sm text-gray-500 mb-3">
                Financial Impact Estimate
              </h3>

              <p className="text-gray-700">
                Estimated value erosion range:
              </p>

              <p className="text-2xl font-bold mt-2 text-gray-900">
                {hasErrors
                  ? "—"
                  : `€${result.valueLossLow.toLocaleString()} – €${result.valueLossHigh.toLocaleString()}`}
              </p>

              <p className="text-sm text-gray-500 mt-3">
                Based on projected correction band if listing remains above market.
              </p>
            </div>

            {/* Commission Defense */}
            <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8">
              <h3 className="text-sm text-gray-500 mb-3">
                Commission Defense Simulation
              </h3>

              <p className="text-gray-700">
                3% commission scenario:
              </p>
              <p className="font-semibold text-gray-900">
                €{result.commissionFull.toLocaleString()}
              </p>

              <p className="mt-3 text-gray-700">
                If reduced to 2.5%:
              </p>
              <p className="font-semibold text-gray-900">
                €{result.commissionReduced.toLocaleString()}
              </p>

              <p className="mt-4 text-red-600 font-bold">
                Potential commission erosion: €{result.commissionLoss.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* STRATEGY */}
        {step === "strategy" && (
          <>
            <div className="grid grid-cols-2 gap-8 mt-8">
              {/* Strategy */}
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8">
                <h3 className="text-sm text-gray-500 mb-3">
                  Strategic Recommendation
                </h3>

                <p className="text-lg font-semibold text-gray-900">
                  {result.strategy}
                </p>

              
              </div>

              {/* Strategic Price */}
              <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8">
                <h3 className="text-sm text-gray-500 mb-3">
                  Strategic Entry Price
                </h3>

                <p className="text-2xl font-bold text-gray-900">
                  €{result.strategicEntryPrice.toLocaleString()}
                </p>

                <p className="text-sm text-gray-500 mt-3">
                  Recommended market-aligned listing strategy.
                </p>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mt-8 bg-white shadow-sm border border-gray-200 rounded-xl p-8">
              <h3 className="text-sm text-gray-500 mb-4">
                Executive Mandate Positioning Summary
              </h3>

              <p className="mt-4 text-gray-800 font-semibold">
  Recommended Broker Framing
</p>

<div className="mt-3 space-y-3">

  {sellerPsychology === "emotional_anchor" && (
    <>
      <p className="text-gray-900">
        The current price reflects a personal expectation rather than market positioning.
      </p>
      <p className="text-gray-900">
        Buyers will not see the same reference point and will respond based on comparable value.
      </p>
      <p className="text-gray-900">
        Entering at <span className="font-semibold">€{result.strategicEntryPrice.toLocaleString()}</span> aligns with how the market actually evaluates the property.
      </p>
    </>
  )}

  {sellerPsychology === "overconfidence" && (
    <>
      <p className="text-gray-900">
        While the market is active, pricing at <span className="font-semibold">€{seller.toLocaleString()}</span> exceeds what buyers are currently accepting.
      </p>
      <p className="text-gray-900">
        This typically leads to early resistance and reduced negotiation power.
      </p>
      <p className="text-gray-900">
        A strategic entry at <span className="font-semibold">€{result.strategicEntryPrice.toLocaleString()}</span> captures demand before resistance builds.
      </p>
    </>
  )}

  {sellerPsychology === "market_denial" && (
    <>
      <p className="text-gray-900">
        Current pricing is not aligned with real-time market conditions.
      </p>
      <p className="text-gray-900">
        Buyers are already adjusting expectations, and listings above market are facing delays and reductions.
      </p>
      <p className="text-gray-900">
        Positioning at <span className="font-semibold">€{result.strategicEntryPrice.toLocaleString()}</span> ensures the property competes effectively.
      </p>
    </>
  )}

  {sellerPsychology === "neighbour_sale_bias" && (
    <>
      <p className="text-gray-900">
        Nearby sales often reflect different timing or conditions that may no longer apply.
      </p>
      <p className="text-gray-900">
        Buyers evaluate based on current comparables, not past peaks.
      </p>
      <p className="text-gray-900">
        Entering at <span className="font-semibold">€{result.strategicEntryPrice.toLocaleString()}</span> aligns with today's market reality.
      </p>
    </>
  )}

  {sellerPsychology === "none" && (
    <>
      <p className="text-gray-900">
        The property is positioned close to market expectations.
      </p>
      <p className="text-gray-900">
        Maintaining alignment supports steady demand and negotiation stability.
      </p>
      <p className="text-gray-900">
        A structured entry at <span className="font-semibold">€{result.strategicEntryPrice.toLocaleString()}</span> ensures optimal positioning.
      </p>
    </>
  )}

</div>

              <p className="text-gray-900 leading-relaxed whitespace-pre-line">
                {result.executiveSummary}
              </p>

              <p className="mt-6 text-gray-800 font-medium">
                {sellerReport.insight}
              </p>
            </div>
          </>
        )}

        {/* DECISION */}
        {step === "decision" && (
          <div className="mt-8 bg-white shadow-sm border border-gray-200 rounded-xl p-8">
            <h3 className="text-sm text-gray-500 mb-6">
              Scenario Comparison
            </h3>

            <div className="grid grid-cols-2 gap-8">

  {/* PATH A — SELLER PRICING */}
  <div className="border border-gray-200 rounded-lg p-6">
    <h4 className="text-xs text-gray-500 mb-3">
      Path A — Seller Pricing
    </h4>

    <p className="text-lg font-semibold text-gray-900">
      €{mandateDecision.sellerPath.entryPrice.toLocaleString()}
    </p>

    <p className="text-sm text-gray-600 mt-4">
      Correction Probability
    </p>

    <p className="font-semibold text-gray-900">
      {mandateDecision.sellerPath.correctionProbability}%
    </p>

    <p className="text-sm text-gray-600 mt-4">
      Value Erosion
    </p>

    <p className="font-semibold text-gray-900">
      €{mandateDecision.sellerPath.valueErosionLow.toLocaleString()} – €{mandateDecision.sellerPath.valueErosionHigh.toLocaleString()}
    </p>

    <p className="text-sm text-gray-600 mt-4">
      Negotiation Leverage
    </p>

    <p className="font-semibold text-gray-900">
      {mandateDecision.sellerPath.negotiationLeverage}
    </p>

    <p className="text-sm text-gray-600 mt-4">
      Time Pressure Risk
    </p>

    <p className="font-semibold text-gray-900">
      {mandateDecision.sellerPath.timePressureRisk}
    </p>
  </div>


  {/* PATH B — STRATEGIC ENTRY */}
  <div className="border-2 border-green-600 rounded-lg p-6 bg-green-50">
    <h4 className="text-xs text-gray-500 mb-3">
      Path B — Strategic Entry
    </h4>

    <p className="text-lg font-semibold text-gray-900">
      €{mandateDecision.strategicPath.entryPrice.toLocaleString()}
    </p>

    <p className="text-sm text-gray-600 mt-4">
      Correction Probability
    </p>

    <p className="font-semibold text-gray-900">
      {mandateDecision.strategicPath.correctionProbability}%
    </p>

    <p className="text-sm text-gray-600 mt-4">
      Value Erosion
    </p>

    <p className="font-semibold text-gray-900">
      €{mandateDecision.strategicPath.valueErosionLow.toLocaleString()} – €{mandateDecision.strategicPath.valueErosionHigh.toLocaleString()}
    </p>

    <p className="text-sm text-gray-600 mt-4">
      Negotiation Leverage
    </p>

    <p className="font-semibold text-gray-900">
      {mandateDecision.strategicPath.negotiationLeverage}
    </p>

    <p className="text-sm text-gray-600 mt-4">
      Time Pressure Risk
    </p>

    <p className="font-semibold text-gray-900">
      {mandateDecision.strategicPath.timePressureRisk}
    </p>
  </div>

</div>

{/* RECOMMENDED STRATEGY */}
<div className="mt-8 border rounded-lg p-6 bg-gray-50">

  <h4 className="text-sm text-gray-500 mb-2">
    Recommended Mandate Strategy
  </h4>

  <p className="text-lg font-semibold text-gray-900">
    {mandateDecision.recommendedPath === "seller_path"
      ? "Proceed with Seller Pricing Strategy"
      : "Proceed with Strategic Entry Strategy"}
  </p>

</div>
          </div>
        )}

        {/* ACTION BUTTONS */}
<div className="mt-12 flex justify-between items-center">

  {/* SAVE (LEFT) */}
  <button
    onClick={async () => {
      try {
        console.log("SENDING DATA...");

        const payload = {
          property: {
            emv,
            sellerAskingPrice: seller,
            deviation: result.deviation,
            marketHeat: result.marketHeat
          },

          decision: {
            recommendedPath: mandateDecision.recommendedPath,
            sellerPath: mandateDecision.sellerPath,
            strategicPath: mandateDecision.strategicPath
          },

          risk: {
            correctionProbability: mandateDecision.correctionProbability,
            valueErosion: mandateDecision.valueErosion
          },

          seller: {
            psychology: mandateDecision.sellerPsychology
          },

          timeline: mandateDecision.timeline,

          broker: {
            strategy: result.strategy,
            summary: result.executiveSummary,
            brokerageName: brokerName
          }
        };

        const res = await fetch("/api/mandate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        await res.json();

        alert("Mandate saved ✅");

      } catch (err) {
        console.error("SAVE ERROR:", err);
        alert("Error saving mandate ❌");
      }
    }}
    className="px-8 py-4 bg-green-600 text-white rounded-xl text-lg font-semibold hover:bg-green-700 transition"
  >
    Save Mandate Decision
  </button>

  {/* GENERATE (RIGHT) */}
  <button
    onClick={async () => {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          emv,
          seller,
          marketTemp: "neutral",
          competition: "medium",
          absorption: "normal",
          rateClimate: "stable",
          microDemand: "medium",
          urgency: "medium",
          brokerName,
          sellerReport
        })
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Mandate_Report.pdf";
      a.click();
    }}
    className="px-8 py-4 bg-black text-white rounded-xl text-lg font-semibold hover:bg-gray-800 transition"
  >
    Generate Client-Ready Pricing Report
  </button>

</div>
        {/* Brokerage Name */}
        <div className="mb-6 mt-8">
          <label className="text-sm text-gray-500">
            Brokerage Name
          </label>
          <input
            type="text"
            value={brokerName}
            onChange={(e) => setBrokerName(e.target.value)}
            className="mt-2 w-full border rounded-lg p-3"
          />
        </div>

        {/* Step Navigation */}
        <div className="mt-12 flex justify-between">
          <button
            onClick={goBack}
            disabled={currentStepIndex === 0}
            className={`px-6 py-3 rounded-lg transition ${
              currentStepIndex === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-300 text-gray-800 hover:bg-gray-50"
            }`}
          >
            Back
          </button>

          <button
            onClick={goNext}
            disabled={currentStepIndex === STEP_ORDER.length - 1}
            className={`px-6 py-3 rounded-lg transition ${
              currentStepIndex === STEP_ORDER.length - 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}