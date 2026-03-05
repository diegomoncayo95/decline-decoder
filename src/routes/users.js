import { Router } from "express";
import { getUser, lookupDeclineCode } from "../db/index.js";

const router = Router();

// GET /api/user-profile/:userId
router.get("/user-profile/:userId", async (req, res) => {
  const user = await getUser(req.params.userId);

  let prob = 1.0;
  const overdueOrders = user.activeOrders.filter(o => o.status === "overdue");
  if (overdueOrders.length > 0) prob -= 0.15 * overdueOrders.length;
  if (user.failedPayments > 0) prob -= 0.2;
  if (user.rescheduledPayments > 0) prob -= 0.1;
  prob = Math.max(0.1, Math.min(1.0, prob));

  const { declineHistory, ...userWithoutHistory } = user;

  res.json({
    ...userWithoutHistory,
    successProbability: Math.round(prob * 100) / 100
  });
});

// GET /api/decline-history/:userId
router.get("/decline-history/:userId", async (req, res) => {
  const user = await getUser(req.params.userId);
  const { status } = req.query;
  const limit = parseInt(req.query.limit, 10);
  const safeLimit = isNaN(limit) || limit <= 0 ? 10 : limit;

  let declines = user.declineHistory || [];

  if (status && status !== "all") {
    declines = declines.filter(d => d.status === status);
  }

  const enriched = await Promise.all(
    declines.slice(0, safeLimit).map(async d => {
      const codeInfo = await lookupDeclineCode(d.code);
      return {
        ...d,
        codeName:      codeInfo.name,
        category:      codeInfo.category,
        actionable:    codeInfo.actionable,
        plainLanguage: codeInfo.aiResponse.whyItHappened,
        whatToDo:      codeInfo.aiResponse.steps
      };
    })
  );

  const allDeclines = user.declineHistory || [];
  const total = allDeclines.length;
  const resolved = allDeclines.filter(d => d.status === "resolved").length;

  res.json({
    userId: user.userId,
    totalDeclines: total,
    resolvedCount: resolved,
    approvalRateTrend: total > 0 ? (resolved > total / 2 ? "improving" : "needs attention") : "no history",
    declines: enriched
  });
});

export default router;
