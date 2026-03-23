export const runtime = "nodejs";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { runEngine } from "@/lib/engine";

export async function POST(req: Request) {
  const body = await req.json();

  const { brokerName, ...engineInput } = body;

const result = runEngine(engineInput);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let y = height - 50;

  const drawText = (text: string, size = 12, bold = false) => {
    page.drawText(text, {
      x: 50,
      y,
      size,
      font: bold ? boldFont : font,
      color: rgb(0, 0, 0)
    });
    y -= size + 12;
  };

  // ===== TITLE =====
  drawText("Mandate Intelligence Report", 22, true);
  drawText(brokerName || "Confidential Brokerage Report", 11);

  y -= 30;

  // Separator line
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7)
  });

  y -= 25;

  // ===== PRICING CONTEXT =====
  drawText("Pricing Context", 16, true);
  y -= 5;
  drawText(`Estimated Market Value: €${engineInput.emv.toLocaleString()}`);
drawText(`Seller Expected Price: €${engineInput.seller.toLocaleString()}`);

  y -= 20;

  // ===== PRICING POSITION =====
drawText("Pricing Position", 16, true);
y -= 5;

drawText(
  `Estimated Market Value: €${result.sellerReport?.pricingPosition?.emv?.toLocaleString() ?? "0"}`
);

drawText(
  `Seller Asking Price: €${result.sellerReport?.pricingPosition?.askingPrice?.toLocaleString() ?? "0"}`
);

drawText(
  `Positioning Gap: +${result.sellerReport?.pricingPosition?.deviationPercent ?? 0}%`
);

drawText(
  `Positioning Class: ${result.sellerReport?.pricingPosition?.positioningClass ?? "N/A"}`
);

y -= 20;

  // ===== MARKET INDICATORS =====
  drawText("Market Indicators", 16, true);

  y -= 10;

  // --- KPI TITLES ---
  page.drawText("Market Strength Index (MSI)", {
    x: 50,
    y,
    size: 11,
    font
  });

  page.drawText("Positioning Alignment Score (PAS)", {
    x: width / 2,
    y,
    size: 11,
    font
  });

  y -= 25;

  // --- KPI NUMBERS ---
  page.drawText(String(result.msi), {
    x: 50,
    y,
    size: 32,
    font: boldFont
  });

  page.drawText(String(result.positioningScore), {
    x: width / 2,
    y,
    size: 32,
    font: boldFont
  });

  y -= 20;

  // --- MSI BAR ---
  const barWidth = 200;
  const barHeight = 8;

  page.drawRectangle({
    x: 50,
    y,
    width: barWidth,
    height: barHeight,
    color: rgb(0.9, 0.9, 0.9)
  });

  page.drawRectangle({
    x: 50,
    y,
    width: (result.msi / 100) * barWidth,
    height: barHeight,
    color:
      result.msi > 70
        ? rgb(0, 0.6, 0)
        : result.msi > 40
        ? rgb(0.85, 0.5, 0)
        : rgb(0.8, 0, 0)
  });

  y -= 30;

  // --- DEVIATION ---
  const riskColor =
    result.deviation > 8
      ? rgb(0.8, 0, 0)
      : result.deviation > 4
      ? rgb(0.85, 0.5, 0)
      : rgb(0, 0.6, 0);

  // --- DEVIATION + OS SIGNALS (BOX) ---
const boxHeight = 80;

page.drawRectangle({
  x: 45,
  y: y - (boxHeight + 10),
  width: width - 90,
  height: boxHeight,
  color: rgb(0.97, 0.97, 0.97)
});

y -= 22;

page.drawText(`Deviation from Market Value: ${result.deviation}%`, {
  x: 60,
  y,
  size: 12,
  font: boldFont,
  color: riskColor
});

y -= 18;

page.drawText(`Positioning: ${result.positioningClass}`, {
  x: 60,
  y,
  size: 11,
  font,
  color: rgb(0.2, 0.2, 0.2)
});

page.drawText(`Risk: ${result.riskLevel}`, {
  x: width / 2,
  y,
  size: 11,
  font,
  color: rgb(0.2, 0.2, 0.2)
});

y -= 18;

page.drawText(`Strategic Entry Price: €${result.strategicEntryPrice.toLocaleString()}`, {
  x: 60,
  y,
  size: 11,
  font,
  color: rgb(0.2, 0.2, 0.2)
});

y -= 30;
  // ===== FINANCIAL IMPACT =====
  drawText("Financial Impact Analysis", 16, true);
  y -= 5;
  drawText(`Projected Value Erosion Range: €${result.valueLossLow.toLocaleString()} – €${result.valueLossHigh.toLocaleString()}`);
  drawText(`Commission Sensitivity Exposure: €${result.commissionLoss.toLocaleString()}`);

  y -= 20;

  // ===== STRATEGY =====
  drawText("Strategic Recommendation", 16, true);
  y -= 5;
  drawText(result.strategy, 12);

  y -= 30;

  page.drawRectangle({
    x: 45,
    y: y - 110,
    width: width - 90,
    height: 90,
    color: rgb(0.95, 0.95, 0.95)
  });

  y -= 20;

  page.drawText("Executive Summary", {
    x: 60,
    y,
    size: 14,
    font: boldFont
  });

  y -= 20;

  page.drawText(
    `Listing priced ${result.deviation}% above market under MSI ${result.msi} increases correction exposure.`,
    { x: 60, y, size: 11, font }
  );

  y -= 18;

  page.drawText(
    `Projected erosion between €${result.valueLossLow.toLocaleString()} and €${result.valueLossHigh.toLocaleString()} materially impacts negotiation leverage.`,
    { x: 60, y, size: 11, font }
  );

  y -= 20;

  // Grey background box
  page.drawRectangle({
    x: 45,
    y: y - 85,
    width: width - 90,
    height: 75,
    color: rgb(0.95, 0.95, 0.95)
  });

  y -= 15;

  // Footer
  page.drawLine({
    start: { x: 50, y: 60 },
    end: { x: width - 50, y: 60 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8)
  });

  page.drawText("Confidential – For Mandate Strategy Discussion Only", {
    x: 50,
    y: 40,
    size: 10,
    font
  });

  const pdfBytes = await pdfDoc.save();

  return new Response(Buffer.from(pdfBytes), {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": "attachment; filename=Mandate_Report.pdf"
  }
});
}