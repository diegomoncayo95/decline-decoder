import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import decodeRouter from "./routes/decode.js";
import riskRouter from "./routes/risk.js";
import usersRouter from "./routes/users.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env") });

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. Check your .env file.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 8080;

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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "decline-decoder-api" });
});

app.use("/api/decode-decline", decodeRouter);
app.use("/api/pre-checkout-risk", riskRouter);
app.use("/api", usersRouter);

// ============================================================
// Start server
// ============================================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║       Decline Decoder API                   ║
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
