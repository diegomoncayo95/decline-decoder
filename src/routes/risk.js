import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { getUser } from "../data/mockUsers.js";

const router = Router();
let _anthropic;
function getAnthropicClient() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

const RISK_SYSTEM_PROMPT = `You are Decline Decoder's pre-checkout risk advisor.
You analyze a Sezzle user's account state and predict whether a purchase will succeed.

RULES:
- Be helpful and specific — reference actual numbers (spending power, overdue amounts)
- Provide 1-3 actionable tips ranked by impact
- Calculate a "sweet spot" amount — the maximum they could likely spend successfully
- Write at an 8th-grade reading level, no jargon
- Be encouraging even when risk is high — always show a path forward

RISK FACTORS (in order of importance):
1. Available spending power vs. purchase amount
2. Overdue/failed payments (these can trigger blocks)
3. Rescheduled payments pending
4. Whether they have an active purchase request
5. Number of recent declines at this merchant (rate limit at 8)

Respond in JSON:
{
  "riskLevel": "low" | "medium" | "high",
  "successProbability": 0.0 to 1.0,
  "explanation": "2-3 sentences explaining the risk",
  "tips": ["tip 1", "tip 2"],
  "maxApprovedAmount": number,
  "sweetSpotAmount": number
}`;

// Calculate risk factors from user data
function calculateRiskFactors(user, amount, merchantName) {
  let riskScore = 0; // 0 = no risk, 100 = guaranteed decline
  const factors = [];

  // Factor 1: Spending power
  if (amount > user.availableSpendingPower) {
    riskScore += 40;
    factors.push(`Purchase ($${amount}) exceeds spending power ($${user.availableSpendingPower})`);
  } else if (amount > user.availableSpendingPower * 0.8) {
    riskScore += 15;
    factors.push(`Purchase is close to spending limit (${Math.round(amount/user.availableSpendingPower*100)}% of available)`);
  }

  // Factor 2: Overdue payments
  const overdueOrders = user.activeOrders.filter(o => o.status === "overdue");
  if (overdueOrders.length > 0) {
    riskScore += 25;
    factors.push(`${overdueOrders.length} overdue payment(s) totaling $${user.overdueAmount}`);
  }

  // Factor 3: Failed/rescheduled payments
  if (user.failedPayments > 0) {
    riskScore += 30;
    factors.push(`Outstanding failed payments`);
  }
  if (user.rescheduledPayments > 0) {
    riskScore += 20;
    factors.push(`Rescheduled payments pending`);
  }

  // Factor 4: Purchase request
  if (!user.hasPurchaseRequest) {
    riskScore += 50; // This is a guaranteed decline
    factors.push(`No active purchase request`);
  }

  // Cap at 100
  riskScore = Math.min(riskScore, 100);

  // Calculate success probability
  const successProbability = Math.max(0, Math.min(1, (100 - riskScore) / 100));

  // Risk level
  let riskLevel = "low";
  if (successProbability < 0.5) riskLevel = "high";
  else if (successProbability < 0.8) riskLevel = "medium";

  // Sweet spot: max amount likely to succeed
  let maxApproved = user.availableSpendingPower;
  if (overdueOrders.length > 0) {
    maxApproved = Math.max(0, maxApproved - user.overdueAmount * 0.5);
  }
  const sweetSpot = Math.round(maxApproved * 0.75 * 100) / 100;

  return {
    riskScore,
    riskLevel,
    successProbability: Math.round(successProbability * 100) / 100,
    factors,
    maxApprovedAmount: Math.round(maxApproved * 100) / 100,
    sweetSpotAmount: Math.round(sweetSpot * 100) / 100
  };
}

// POST /api/pre-checkout-risk
router.post("/", async (req, res) => {
  try {
    const { userId, merchantName, amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        error: { code: "MISSING_AMOUNT", message: "amount is required" }
      });
    }

    const user = getUser(userId);
    const riskCalc = calculateRiskFactors(user, amount, merchantName);

    // Build context for Claude
    const userContext = `
USER: ${user.name}
- Available spending power: $${user.availableSpendingPower} of $${user.totalSpendingPower}
- Active orders: ${user.activeOrders.length}
- Overdue orders: ${user.activeOrders.filter(o => o.status === "overdue").length}
- Overdue amount: $${user.overdueAmount}
- Has purchase request: ${user.hasPurchaseRequest}
${user.activeOrders.filter(o => o.status === "overdue").map(o =>
  `- OVERDUE: #${o.orderId} at ${o.merchant} — $${o.perInstallment}, ${o.daysOverdue} days late`
).join("\n")}

ATTEMPTED PURCHASE:
- Merchant: ${merchantName || "Unknown store"}
- Amount: $${amount}

RISK CALCULATION:
- Risk score: ${riskCalc.riskScore}/100
- Success probability: ${Math.round(riskCalc.successProbability * 100)}%
- Risk level: ${riskCalc.riskLevel}
- Factors: ${riskCalc.factors.join("; ")}
- Max likely approved: $${riskCalc.maxApprovedAmount}
- Sweet spot amount: $${riskCalc.sweetSpotAmount}

Generate a personalized, friendly risk assessment.`;

    const message = await getAnthropicClient().messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 512,
      messages: [{ role: "user", content: userContext }],
      system: RISK_SYSTEM_PROMPT
    });

    let aiResponse;
    try {
      const text = message.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      aiResponse = {
        riskLevel: riskCalc.riskLevel,
        successProbability: riskCalc.successProbability,
        explanation: riskCalc.factors.length > 0
          ? `This purchase has some risk factors: ${riskCalc.factors.join(". ")}.`
          : "This purchase looks good to go!",
        tips: riskCalc.factors.length > 0
          ? ["Check your Sezzle app for any outstanding payments", "Consider a lower purchase amount"]
          : ["You're in good shape — go ahead with your purchase!"],
        maxApprovedAmount: riskCalc.maxApprovedAmount,
        sweetSpotAmount: riskCalc.sweetSpotAmount
      };
    }

    res.json({
      riskLevel: aiResponse.riskLevel || riskCalc.riskLevel,
      successProbability: aiResponse.successProbability || riskCalc.successProbability,
      explanation: aiResponse.explanation,
      tips: aiResponse.tips,
      maxApprovedAmount: aiResponse.maxApprovedAmount || riskCalc.maxApprovedAmount,
      sweetSpotAmount: aiResponse.sweetSpotAmount || riskCalc.sweetSpotAmount
    });

  } catch (error) {
    console.error("Risk check error:", error.message);
    const user = getUser(req.body.userId);
    const riskCalc = calculateRiskFactors(user, req.body.amount, req.body.merchantName);

    res.json({
      ...riskCalc,
      explanation: `Based on your account, this purchase has a ${riskCalc.riskLevel} risk level.`,
      tips: ["Check your Sezzle app for any outstanding payments"],
      _fallback: true
    });
  }
});

// POST /api/pre-checkout-risk/what-if (for the slider)
router.post("/what-if", async (req, res) => {
  const { userId, merchantName, amount } = req.body;
  const user = getUser(userId);
  const riskCalc = calculateRiskFactors(user, amount, merchantName);

  // Quick response — no AI call for the slider (needs to be fast)
  res.json({
    riskLevel: riskCalc.riskLevel,
    successProbability: riskCalc.successProbability,
    explanation: amount <= riskCalc.sweetSpotAmount
      ? `$${amount} is within your safe zone — this should go through!`
      : amount <= riskCalc.maxApprovedAmount
        ? `$${amount} is possible but close to your limit.`
        : `$${amount} is risky — your effective limit is about $${riskCalc.maxApprovedAmount} right now.`,
    maxApprovedAmount: riskCalc.maxApprovedAmount,
    sweetSpotAmount: riskCalc.sweetSpotAmount
  });
});

export default router;
