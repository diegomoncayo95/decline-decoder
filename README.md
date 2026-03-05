# Decline Decoder — Backend API

## What is this?

This is the **brain** of our hackathon project. It's a server that:

1. **Translates decline codes** → When a Sezzle user gets a confusing error like `1919` or `insufficient_credit_limit`, our API calls Claude AI and returns a friendly, personalized explanation + steps to fix it.

2. **Predicts if a purchase will work** → Before buying, a user can check "will this $150 Target purchase go through?" and get a risk score + tips.

## How to run it (takes 30 seconds)

### Step 1: Create the `.env` file
Create a file called `.env` in the `project/` folder with:
```
ANTHROPIC_API_KEY=your-key-here
PORT=8080
```
(Ask Diego for the API key)

### Step 2: Start the server
```bash
cd project
npm install
node src/server.js
```
You should see: `🔓 Decline Decoder API Running on port 8080`

### Step 3: Test it
In a **new terminal tab**:
```bash
cd project
./test-endpoints.sh
```
This runs all 6 endpoints and shows the responses.

## What each file does

```
project/
├── src/
│   ├── server.js          ← The main server (starts everything)
│   ├── data/
│   │   ├── declineCodes.js ← All 24 Sezzle + Marqeta decline codes
│   │   └── mockUsers.js    ← Fake user "Sarah Chen" for demo
│   └── routes/
│       ├── decode.js       ← MUST 1: "What does this decline mean?"
│       └── risk.js         ← MUST 2: "Will my purchase go through?"
├── Dockerfile              ← For deploying to AWS App Runner
├── test-endpoints.sh       ← Quick test script
├── package.json            ← Dependencies list
└── .env                    ← API key (DO NOT share publicly)
```

## The 6 API endpoints

| Endpoint | What it does |
|----------|-------------|
| `GET /api/health` | Check if server is running |
| `POST /api/decode-decline` | **MUST 1** — Explain a decline code with AI |
| `POST /api/pre-checkout-risk` | **MUST 2** — Check if purchase will succeed |
| `POST /api/pre-checkout-risk/what-if` | Quick slider (no AI, instant) |
| `GET /api/user-profile/:userId` | Get user account info |
| `GET /api/decline-history/:userId` | Get past declines |

## Example: Decode a decline

**Request:**
```json
{
  "declineCode": "insufficient_credit_limit",
  "merchantName": "Best Buy",
  "amount": 349.99,
  "userId": "sarah-chen-001"
}
```

**Response (AI-generated):**
```json
{
  "explanation": "You tried to buy something for $349.99 at Best Buy, but you only have $187.50 available right now...",
  "actions": [
    "Pay off your overdue Samsung order ($106.25)",
    "Look for the item at a lower price (under $187.50)"
  ],
  "severity": "medium",
  "estimatedSuccessAfterFix": 0.85
}
```

## Next steps
- [ ] Generate frontend in Lovable using `docs/LOVABLE-PROMPT.md`
- [ ] Deploy to AWS App Runner using the Dockerfile
- [ ] Connect frontend to this API
