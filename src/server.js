import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import decodeRouter from "./routes/decode.js";
import riskRouter from "./routes/risk.js";
import { getUser } from "./data/mockUsers.js";
import { lookupDeclineCode } from "./data/declineCodes.js";

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env");
dotenv.config({ path: envPath });

// Fallback: manually read .env if dotenv didn't set the key
if (!process.env.ANTHROPIC_API_KEY && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
  if (match) process.env.ANTHROPIC_API_KEY = match[1].trim();
}

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    /https:\/\/main\..*\.amplifyapp\.com/,
    /https:\/\/.*\.lovable\.app/
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// ============================================================
// Routes
// ============================================================

// Health check (required for App Runner)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "decline-decoder-api" });
});

// MUST 1: Decode a decline
app.use("/api/decode-decline", decodeRouter);

// MUST 2: Pre-checkout risk check
app.use("/api/pre-checkout-risk", riskRouter);

// User profile (for dashboard)
app.get("/api/user-profile/:userId", (req, res) => {
  const user = getUser(req.params.userId);

  // Calculate success probability from account health
  let prob = 1.0;
  const overdueOrders = user.activeOrders.filter(o => o.status === "overdue");
  if (overdueOrders.length > 0) prob -= 0.15 * overdueOrders.length;
  if (user.failedPayments > 0) prob -= 0.2;
  if (user.rescheduledPayments > 0) prob -= 0.1;
  prob = Math.max(0.1, Math.min(1.0, prob));

  res.json({
    ...user,
    successProbability: Math.round(prob * 100) / 100,
    declineHistory: undefined // separate endpoint
  });
});

// Decline history
app.get("/api/decline-history/:userId", (req, res) => {
  const user = getUser(req.params.userId);
  const { status, limit = 10 } = req.query;

  let declines = user.declineHistory || [];

  // Filter by status if provided
  if (status && status !== "all") {
    declines = declines.filter(d => d.status === status);
  }

  // Enrich with code details
  const enriched = declines.slice(0, parseInt(limit)).map(d => {
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

  const resolved = (user.declineHistory || []).filter(d => d.status === "resolved").length;
  const total = (user.declineHistory || []).length;

  res.json({
    userId: user.userId,
    totalDeclines: total,
    resolvedCount: resolved,
    approvalRateTrend: resolved > total / 2 ? "improving" : "needs attention",
    declines: enriched
  });
});

// ============================================================
// Start server
// ============================================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║       🔓 Decline Decoder API                ║
║       Running on port ${PORT}                  ║
║                                              ║
║  Endpoints:                                  ║
║  GET  /api/health                            ║
║  POST /api/decode-decline                    ║
║  POST /api/pre-checkout-risk                 ║
║  POST /api/pre-checkout-risk/what-if         ║
║  GET  /api/user-profile/:userId              ║
║  GET  /api/decline-history/:userId           ║
╚══════════════════════════════════════════════╝
  `);
});
