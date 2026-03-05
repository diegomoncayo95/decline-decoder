import { Router } from "express";
import { getUser } from "../data/mockUsers.js";
import { lookupDeclineCode } from "../data/declineCodes.js";

const router = Router();

// GET /api/user-profile/:userId
router.get("/user-profile/:userId", (req, res) => {
  const user = getUser(req.params.userId);

  // Calculate success probability from account health
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
router.get("/decline-history/:userId", (req, res) => {
  const user = getUser(req.params.userId);
  const { status } = req.query;
  const limit = parseInt(req.query.limit, 10);
  const safeLimit = isNaN(limit) || limit <= 0 ? 10 : limit;

  let declines = user.declineHistory || [];

  // Filter by status if provided
  if (status && status !== "all") {
    declines = declines.filter(d => d.status === status);
  }

  // Enrich with code details
  const enriched = declines.slice(0, safeLimit).map(d => {
    const codeInfo = lookupDeclineCode(d.code);
    return {
      ...d,
      codeName: codeInfo.name,
      category: codeInfo.category,
      actionable: codeInfo.actionable,
      plainLanguage: codeInfo.plainLanguage,
      whatToDo: codeInfo.whatToDo
    };
  });

  const allDeclines = user.declineHistory || [];
  const total = allDeclines.length;
  const resolved = allDeclines.filter(d => d.status === "resolved").length;

  let approvalRateTrend = "no history";
  if (total > 0) {
    approvalRateTrend = resolved > total / 2 ? "improving" : "needs attention";
  }

  res.json({
    userId: user.userId,
    totalDeclines: total,
    resolvedCount: resolved,
    approvalRateTrend,
    declines: enriched
  });
});

export default router;
