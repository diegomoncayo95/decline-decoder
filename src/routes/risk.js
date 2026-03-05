import { Router } from "express";
import { getAnthropicClient, parseAIJson, AI_MODEL } from "../lib/ai.js";
import { getUser } from "../data/mockUsers.js";

const router = Router();

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

function calculateRiskFactors(user, amount) {
  let riskScore = 0;
  const factors = [];

  if (amount > user.availableSpendingPower) {
    riskScore += 40;
    factors.push(`Purchase ($${amount}) exceeds spending power ($${user.availableSpendingPower})`);
  } else if (amount > user.availableSpendingPower * 0.8) {
    riskScore += 15;
    factors.push(`Purchase is close to spending limit (${Math.round(amount / user.availableSpendingPower * 100)}% of available)`);
  }

  const overdueOrders = user.activeOrders.filter(o => o.status === "overdue");
  if (overdueOrders.length > 0) {
    riskScore += 25;
    factors.push(`${overdueOrders.length} overdue payment(s) totaling $${user.overdueAmount}`);
  }

  if (user.failedPayments > 0) {
    riskScore += 30;
    factors.push(`Outstanding failed payments`);
  }
  if (user.rescheduledPayments > 0) {
    riskScore += 20;
    factors.push(`Rescheduled payments pending`);
  }

  if (!user.hasPurchaseRequest) {
    riskScore += 50;
    factors.push(`No active purchase request`);
  }

  riskScore = Math.min(riskScore, 100);

  const successProbability = Math.max(0, Math.min(1, (100 - riskScore) / 100));
  let riskLevel = "low";
  if (successProbability < 0.5) riskLevel = "high";
  else if (successProbability < 0.8) riskLevel = "medium";

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
    sweetSpotAmount:   Math.round(sweetSpot * 100) / 100
  };
}

// POST /api/pre-checkout-risk
router.post("/", async (req, res) => {
  try {
    const { userId, merchantName } = req.body;

    if (req.body.amount === undefined || req.body.amount === null) {
      return res.status(400).json({
        error: { code: "MISSING_AMOUNT", message: "amount is required" }
      });
    }
    const parsedAmount = Number(req.body.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        error: { code: "INVALID_AMOUNT", message: "amount must be a positive number" }
      });
    }

    const user = await getUser(userId);
    const riskCalc = calculateRiskFactors(user, parsedAmount);

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
- Amount: $${parsedAmount}

RISK CALCULATION:
- Risk score: ${riskCalc.riskScore}/100
- Success probability: ${Math.round(riskCalc.successProbability * 100)}%
- Risk level: ${riskCalc.riskLevel}
- Factors: ${riskCalc.factors.join("; ")}
- Max likely approved: $${riskCalc.maxApprovedAmount}
- Sweet spot amount: $${riskCalc.sweetSpotAmount}

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
        sweetSpotAmount:   riskCalc.sweetSpotAmount
      };
    }

    res.json({
      riskLevel:          aiResponse.riskLevel          ?? riskCalc.riskLevel,
      successProbability: aiResponse.successProbability ?? riskCalc.successProbability,
      explanation:        aiResponse.explanation,
      tips:               aiResponse.tips,
      maxApprovedAmount:  aiResponse.maxApprovedAmount  ?? riskCalc.maxApprovedAmount,
      sweetSpotAmount:    aiResponse.sweetSpotAmount    ?? riskCalc.sweetSpotAmount
    });

  } catch (error) {
    console.error("Risk check error:", error.message);
    const user = await getUser(req.body.userId);
    const parsedAmount = Number(req.body.amount);
    const riskCalc = calculateRiskFactors(user, parsedAmount);

    res.json({
      riskLevel:          riskCalc.riskLevel,
      successProbability: riskCalc.successProbability,
      factors:            riskCalc.factors,
      maxApprovedAmount:  riskCalc.maxApprovedAmount,
      sweetSpotAmount:    riskCalc.sweetSpotAmount,
      explanation:        `Based on your account, this purchase has a ${riskCalc.riskLevel} risk level.`,
      tips:               ["Check your Sezzle app for any outstanding payments"]
    });
  }
});

// POST /api/pre-checkout-risk/what-if (for the slider — no AI, fast)
router.post("/what-if", async (req, res) => {
  try {
    const { userId } = req.body;

    if (req.body.amount === undefined || req.body.amount === null) {
      return res.status(400).json({
        error: { code: "MISSING_AMOUNT", message: "amount is required" }
      });
    }
    const parsedAmount = Number(req.body.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        error: { code: "INVALID_AMOUNT", message: "amount must be a positive number" }
      });
    }

    const user = await getUser(userId);
    const riskCalc = calculateRiskFactors(user, parsedAmount);

    res.json({
      riskLevel:          riskCalc.riskLevel,
      successProbability: riskCalc.successProbability,
      explanation: parsedAmount <= riskCalc.sweetSpotAmount
        ? `$${parsedAmount} is within your safe zone — this should go through!`
        : parsedAmount <= riskCalc.maxApprovedAmount
          ? `$${parsedAmount} is possible but close to your limit.`
          : `$${parsedAmount} is risky — your effective limit is about $${riskCalc.maxApprovedAmount} right now.`,
      maxApprovedAmount: riskCalc.maxApprovedAmount,
      sweetSpotAmount:   riskCalc.sweetSpotAmount
    });
  } catch (error) {
    console.error("What-if error:", error.message);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unable to calculate risk" } });
  }
});

export default router;
