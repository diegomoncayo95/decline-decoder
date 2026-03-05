import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { lookupDeclineCode } from "../data/declineCodes.js";
import { getUser } from "../data/mockUsers.js";

const router = Router();
let _anthropic;
function getAnthropicClient() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

const SYSTEM_PROMPT = `You are Decline Decoder, a helpful AI assistant for Sezzle consumers.
You translate virtual card decline codes into plain, friendly language.

RULES:
- Write at an 8th-grade reading level
- Never use jargon (no "issuer", "acquirer", "authorization", "MCC", "MID")
- Always provide 2-3 specific, actionable next steps
- Be encouraging, not scary — the user is frustrated, help them feel in control
- Reference the user's specific data when provided (order amounts, merchant names, spending power)
- Keep the main explanation to 2-3 sentences max
- Always end on a positive note — what they CAN do, not what they can't

You will receive the decline code details and the user's account context.
Respond in JSON format with these fields:
{
  "explanation": "2-3 sentence plain-language explanation",
  "impact": "1 sentence about how this affects them",
  "actions": ["step 1", "step 2", "step 3"],
  "estimatedSuccessAfterFix": 0.0 to 1.0,
  "encouragement": "1 short encouraging sentence"
}`;

// POST /api/decode-decline
router.post("/", async (req, res) => {
  try {
    const { declineCode, merchantName, amount, userId } = req.body;

    if (!declineCode) {
      return res.status(400).json({
        error: { code: "MISSING_DECLINE_CODE", message: "declineCode is required" }
      });
    }

    // Look up the code from our database
    const codeInfo = lookupDeclineCode(declineCode);
    const user = getUser(userId);

    // Build context for Claude
    const userContext = `
USER CONTEXT:
- Name: ${user.name}
- Available spending power: $${user.availableSpendingPower}
- Active orders: ${user.activeOrders.length} (${user.activeOrders.filter(o => o.status === "overdue").length} overdue)
- Overdue amount: $${user.overdueAmount}
- Has purchase request active: ${user.hasPurchaseRequest}
- Is Anywhere member: ${user.isAnywhereMember}
${user.activeOrders.filter(o => o.status === "overdue").map(o =>
  `- OVERDUE: Order #${o.orderId} at ${o.merchant} — $${o.perInstallment} installment, ${o.daysOverdue} days late`
).join("\n")}

DECLINE DETAILS:
- Code: ${declineCode}
- Code name: ${codeInfo.name}
- Category: ${codeInfo.category}
- Merchant: ${merchantName || "Unknown"}
- Amount attempted: $${amount || "Unknown"}
- Why it happened: ${codeInfo.aiResponse.whyItHappened}
- Steps to fix: ${codeInfo.aiResponse.steps.join("; ")}
- Time to fix: ${codeInfo.aiResponse.timeToFix}
- Is actionable: ${codeInfo.actionable}
- Current generic message: ${codeInfo.currentMessage}

Generate a personalized, friendly response for this specific user and their specific situation.`;

    // Call Claude API
    const message = await getAnthropicClient().messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 512,
      messages: [
        { role: "user", content: userContext }
      ],
      system: SYSTEM_PROMPT
    });

    // Parse Claude's response
    let aiResponse;
    try {
      const text = message.content[0].text;
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (parseErr) {
      // Fallback to static response if AI parsing fails
      aiResponse = {
        explanation: codeInfo.aiResponse.whyItHappened,
        impact: `Time to fix: ${codeInfo.aiResponse.timeToFix}`,
        actions: codeInfo.aiResponse.steps,
        estimatedSuccessAfterFix: codeInfo.actionable ? 0.8 : 0.1,
        encouragement: "You've got this — most declines are quick fixes!"
      };
    }

    res.json({
      code: declineCode,
      name: codeInfo.name,
      category: codeInfo.category,
      actionable: codeInfo.actionable,
      currentMessage: codeInfo.currentMessage,
      explanation: aiResponse.explanation,
      impact: aiResponse.impact,
      actions: aiResponse.actions,
      estimatedSuccessAfterFix: aiResponse.estimatedSuccessAfterFix,
      encouragement: aiResponse.encouragement,
      timeToFix: codeInfo.aiResponse.timeToFix,
      canWeHelp: codeInfo.aiResponse.canWeHelp
    });

  } catch (error) {
    console.error("Decode error:", error.message);

    // Graceful fallback — still return useful info even if AI fails
    const { declineCode } = req.body;
    const codeInfo = lookupDeclineCode(declineCode);

    res.json({
      code: declineCode,
      name: codeInfo.name,
      category: codeInfo.category,
      actionable: codeInfo.actionable,
      currentMessage: codeInfo.currentMessage,
      explanation: codeInfo.aiResponse.whyItHappened,
      impact: `Time to fix: ${codeInfo.aiResponse.timeToFix}`,
      actions: codeInfo.aiResponse.steps,
      estimatedSuccessAfterFix: codeInfo.actionable ? 0.75 : 0.1,
      encouragement: "Most declines are quick fixes — you've got this!",
      timeToFix: codeInfo.aiResponse.timeToFix,
      canWeHelp: codeInfo.aiResponse.canWeHelp,
      _fallback: true
    });
  }
});

export default router;
