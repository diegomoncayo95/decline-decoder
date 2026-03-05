import { Router } from "express";
import { getAnthropicClient, parseAIJson, AI_MODEL } from "../lib/ai.js";
import { getUser } from "../db/index.js";

const router = Router();

const RISK_SYSTEM_PROMPT = `You are Decline Decoder's pre-checkout risk advisor for Sezzle consumers.
You analyze a user's account and predict whether a purchase will succeed.

RULES:
- Be helpful and specific — reference actual numbers (spending power, overdue amounts)
- Provide 1-3 actionable tips ranked by impact
- Calculate a "sweet spot" amount — the maximum they could likely spend successfully
- Write at an 8th-grade reading level, no jargon
- Be encouraging even when risk is high — always show a path forward
- Reference the specific ACTIVE WARNING SIGNALS

THE 3 EARLY WARNING SIGNALS:
1. New Account: account < 24 hours old AND already placed 1 order → likely blocked
2. Failed Payments: user has overdue/failed payments → Sezzle may block new purchases
3. Low Spending Power: available spending power < $100 → limited purchasing ability

Respond in JSON:
{
  "riskLevel": "low" | "medium" | "high",
  "successProbability": 0.0 to 1.0,
  "explanation": "2-3 sentences explaining the risk",
  "tips": ["tip 1", "tip 2"],
  "maxApprovedAmount": number,
  "sweetSpotAmount": number
}`;

// ============================================================
// Calculate risk based on 3 EARLY WARNING SIGNALS
// ============================================================
function calculateRiskFactors(user, amount) {
  let riskScore = 0;
  const warnings = [];

  // ── Signal #1: New Account Behavior ──
  // Account < 24 hours AND already placed 1 order
  if (user.riskSignals?.newAccountRisk || (user.accountAgeHours < 24 && user.activeOrders.length >= 1)) {
    riskScore += 40;
    warnings.push({
      signal: "New Account",
      message: "Your account is less than 24 hours old and you've already placed an order. Sezzle limits new accounts to 1 order in the first 24 hours.",
      severity: "high"
    });
  }

  // ── Signal #2: Existing Failed Payments ──
  const overdueOrders = user.activeOrders.filter(o => o.status === "overdue");
  if (user.failedPayments > 0 || overdueOrders.length > 0) {
    riskScore += 35;
    const overdueTotal = overdueOrders.reduce((sum, o) => sum + o.perInstallment, 0);
    warnings.push({
      signal: "Failed Payments",
      message: overdueOrders.length > 0
        ? `You have ${overdueOrders.length} overdue payment(s) totaling $${overdueTotal.toFixed(2)}. Sezzle may block new purchases until these are resolved.`
        : `You have outstanding failed payments on your account.`,
      severity: "high"
    });
  }

  // ── Signal #3: Insufficient Spending Power ──
  if (user.availableSpendingPower < 100) {
    riskScore += 25;
    warnings.push({
      signal: "Low Spending Power",
      message: `Your available spending power is $${user.availableSpendingPower.toFixed(2)}, which is below $100. This limits what you can purchase.`,
      severity: user.availableSpendingPower < 50 ? "high" : "medium"
    });
  }

  // ── Additional: Amount vs spending power ──
  if (amount > user.availableSpendingPower) {
    riskScore += 30;
    warnings.push({
      signal: "Over Limit",
      message: `This purchase ($${amount}) exceeds your available spending power ($${user.availableSpendingPower.toFixed(2)}).`,
      severity: "high"
    });
  } else if (amount > user.availableSpendingPower * 0.8) {
    riskScore += 10;
    warnings.push({
      signal: "Close to Limit",
      message: `This purchase uses ${Math.round(amount / user.availableSpendingPower * 100)}% of your available spending power.`,
      severity: "medium"
    });
  }

  riskScore = Math.min(riskScore, 100);
  const successProbability = Math.max(0, Math.min(1, (100 - riskScore) / 100));

  let riskLevel = "low";
  if (successProbability < 0.4) riskLevel = "high";
  else if (successProbability < 0.75) riskLevel = "medium";

  // Sweet spot calculation
  let maxApproved = user.availableSpendingPower;
  if (overdueOrders.length > 0) maxApproved *= 0.6;
  if (user.failedPayments > 0) maxApproved *= 0.5;
  const sweetSpot = Math.round(maxApproved * 0.75 * 100) / 100;

  return {
    riskScore,
    riskLevel,
    successProbability: Math.round(successProbability * 100) / 100,
    warnings,
    maxApprovedAmount: Math.round(maxApproved * 100) / 100,
    sweetSpotAmount: Math.round(sweetSpot * 100) / 100
  };
}

// ============================================================
// POST /api/pre-checkout-risk
// ============================================================
router.post("/", async (req, res) => {
  try {
    const { userId, merchantName } = req.body;
    const amount = Number(req.body.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: { code: "INVALID_AMOUNT", message: "amount must be a positive number" } });
    }

    const user = await getUser(userId);
    const riskCalc = calculateRiskFactors(user, amount);

    const userContext = `
USER: ${user.name} (member since ${user.memberSince}, score: ${user.sezzleScore})
- Account age: ${user.accountAgeHours || "unknown"} hours
- Available spending power: $${user.availableSpendingPower} of $${user.totalSpendingPower}
- Active orders: ${user.activeOrders.length}
- Overdue orders: ${user.activeOrders.filter(o => o.status === "overdue").length}
- Overdue amount: $${user.overdueAmount}
- Failed payments: ${user.failedPayments}
${user.activeOrders.filter(o => o.status === "overdue").map(o =>
  `- OVERDUE: #${o.orderId} at ${o.merchant} — $${o.perInstallment}/installment, ${o.daysOverdue} days late`
).join("\n")}

ATTEMPTED PURCHASE: $${amount} at ${merchantName || "Unknown store"}

ACTIVE WARNING SIGNALS:
${riskCalc.warnings.length > 0
  ? riskCalc.warnings.map(w => `⚠️ ${w.signal} (${w.severity}): ${w.message}`).join("\n")
  : "✅ No warning signals — account looks healthy"}

Risk score: ${riskCalc.riskScore}/100 | Success: ${Math.round(riskCalc.successProbability * 100)}%
Max approved: $${riskCalc.maxApprovedAmount} | Sweet spot: $${riskCalc.sweetSpotAmount}

Generate a personalized, friendly risk assessment.`;

    const message = await getAnthropicClient().messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      messages: [{ role: "user", content: userContext }],
      system: RISK_SYSTEM_PROMPT
    });

    let aiResponse;
    try {
      aiResponse = parseAIJson(message.content[0].text);
    } catch {
      aiResponse = null;
    }

    res.json({
      riskLevel:          aiResponse?.riskLevel || riskCalc.riskLevel,
      successProbability: aiResponse?.successProbability || riskCalc.successProbability,
      explanation:        aiResponse?.explanation || `Based on your account, this purchase has a ${riskCalc.riskLevel} risk level.`,
      tips:               aiResponse?.tips || riskCalc.warnings.map(w => w.message),
      activeWarnings:     riskCalc.warnings,
      maxApprovedAmount:  aiResponse?.maxApprovedAmount || riskCalc.maxApprovedAmount,
      sweetSpotAmount:    aiResponse?.sweetSpotAmount || riskCalc.sweetSpotAmount
    });

  } catch (error) {
    console.error("Risk check error:", error.message);
    const user = await getUser(req.body.userId);
    const riskCalc = calculateRiskFactors(user, Number(req.body.amount));

    res.json({
      ...riskCalc,
      explanation: `Based on your account, this purchase has a ${riskCalc.riskLevel} risk level.`,
      tips: riskCalc.warnings.map(w => w.message),
      activeWarnings: riskCalc.warnings,
      _fallback: true
    });
  }
});

// ============================================================
// POST /api/pre-checkout-risk/what-if (fast, no AI)
// ============================================================
router.post("/what-if", async (req, res) => {
  const { userId } = req.body;
  const amount = Number(req.body.amount);

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: { code: "INVALID_AMOUNT", message: "amount must be a positive number" } });
  }

  const user = await getUser(userId);
  const riskCalc = calculateRiskFactors(user, amount);

  res.json({
    riskLevel: riskCalc.riskLevel,
    successProbability: riskCalc.successProbability,
    activeWarnings: riskCalc.warnings,
    explanation: riskCalc.warnings.length === 0
      ? `$${amount} looks good — this should go through!`
      : `$${amount} has ${riskCalc.warnings.length} risk signal(s): ${riskCalc.warnings.map(w => w.signal).join(", ")}`,
    maxApprovedAmount: riskCalc.maxApprovedAmount,
    sweetSpotAmount: riskCalc.sweetSpotAmount
  });
});

export default router;
