import { InitDB, DB } from "./connection.js";

// ============================================================
// MOCK DATA — used when no database is configured
// This lets the team develop without a DB running
// ============================================================

const MOCK_USERS = {
  // User 1: Sarah — moderate risk, 1 overdue payment (Signal #2: failed payments)
  "sarah-chen-001": {
    userId: "sarah-chen-001",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    memberSince: "2023",
    accountAgeHours: 8760, // ~1 year
    sezzleScore: "Good",
    availableSpendingPower: 187.50,
    totalSpendingPower: 500.00,
    overdueAmount: 106.25,
    rescheduledPayments: 0,
    failedPayments: 1,
    hasPurchaseRequest: true,
    isAnywhereMember: true,
    isPremiumMember: false,
    activeOrders: [
      { orderId: "SZ-29481", merchant: "Target", total: 249.99, perInstallment: 62.50, paidInstallments: 2, totalInstallments: 4, nextDueDate: "2026-03-12", status: "on_track" },
      { orderId: "SZ-30872", merchant: "Samsung", total: 425.00, perInstallment: 106.25, paidInstallments: 1, totalInstallments: 4, nextDueDate: "2026-03-03", status: "overdue", daysOverdue: 2 },
      { orderId: "SZ-31203", merchant: "SHEIN", total: 54.99, perInstallment: 13.75, paidInstallments: 3, totalInstallments: 4, nextDueDate: "2026-03-20", status: "on_track" }
    ],
    declineHistory: [
      { id: "dec-001", date: "2026-03-03T14:32:00Z", merchantName: "Best Buy", amount: 349.99, code: "insufficient_credit_limit", status: "unresolved" },
      { id: "dec-002", date: "2026-02-28T10:15:00Z", merchantName: "Amazon", amount: 89.99, code: "outstanding_failed_payments", status: "resolved", resolvedAction: "Paid overdue installment" },
      { id: "dec-003", date: "2026-02-15T16:45:00Z", merchantName: "Hiwingo Ltd", amount: 50.00, code: "insufficient_credit_limit", status: "resolved", resolvedAction: "Lowered purchase amount" }
    ],
    // Pre-checkout risk signals
    riskSignals: {
      newAccountRisk: false,       // Account is > 24 hours old
      failedPaymentRisk: true,     // Has 1 failed payment (Signal #2)
      lowSpendingPowerRisk: false  // $187.50 > $100
    }
  },

  // User 2: Marcus — NEW CUSTOMER, account < 24 hours, already placed 1 order (Signal #1)
  "marcus-johnson-002": {
    userId: "marcus-johnson-002",
    name: "Marcus Johnson",
    email: "marcus.j@email.com",
    memberSince: "2026",
    accountAgeHours: 18, // Less than 24 hours! Signal #1
    sezzleScore: "Fair",
    availableSpendingPower: 150.00,
    totalSpendingPower: 150.00,
    overdueAmount: 0,
    rescheduledPayments: 0,
    failedPayments: 0,
    hasPurchaseRequest: true,
    isAnywhereMember: false,
    isPremiumMember: false,
    activeOrders: [
      { orderId: "SZ-31980", merchant: "Nike", total: 120.00, perInstallment: 30.00, paidInstallments: 0, totalInstallments: 4, nextDueDate: "2026-03-18", status: "on_track" }
    ],
    declineHistory: [
      { id: "dec-007", date: "2026-03-05T15:00:00Z", merchantName: "Foot Locker", amount: 180.00, code: "exceeds_new_customer_order_threshold", status: "unresolved" }
    ],
    riskSignals: {
      newAccountRisk: true,        // Signal #1: account < 24h AND already 1 order
      failedPaymentRisk: false,
      lowSpendingPowerRisk: false
    }
  },

  // User 3: Priya — excellent standing, no risk signals
  "priya-patel-003": {
    userId: "priya-patel-003",
    name: "Priya Patel",
    email: "priya.patel@email.com",
    memberSince: "2021",
    accountAgeHours: 43800, // ~5 years
    sezzleScore: "Excellent",
    availableSpendingPower: 750.00,
    totalSpendingPower: 1000.00,
    overdueAmount: 0,
    rescheduledPayments: 0,
    failedPayments: 0,
    hasPurchaseRequest: true,
    isAnywhereMember: true,
    isPremiumMember: true,
    activeOrders: [
      { orderId: "SZ-28441", merchant: "Apple Store", total: 799.00, perInstallment: 199.75, paidInstallments: 3, totalInstallments: 4, nextDueDate: "2026-03-10", status: "on_track" },
      { orderId: "SZ-29903", merchant: "Nordstrom", total: 312.00, perInstallment: 78.00, paidInstallments: 2, totalInstallments: 4, nextDueDate: "2026-03-15", status: "on_track" }
    ],
    declineHistory: [
      { id: "dec-009", date: "2025-11-20T08:30:00Z", merchantName: "Walmart", amount: 450.00, code: "insufficient_credit_limit", status: "resolved", resolvedAction: "Paid down existing order" }
    ],
    riskSignals: {
      newAccountRisk: false,
      failedPaymentRisk: false,
      lowSpendingPowerRisk: false  // All clear!
    }
  },

  // User 4: Derek — HIGH RISK, ALL 3 signals active
  "derek-williams-004": {
    userId: "derek-williams-004",
    name: "Derek Williams",
    email: "derek.w@email.com",
    memberSince: "2024",
    accountAgeHours: 8760,
    sezzleScore: "Poor",
    availableSpendingPower: 45.00, // Signal #3: below $100
    totalSpendingPower: 200.00,
    overdueAmount: 72.50,
    rescheduledPayments: 1,
    failedPayments: 2,            // Signal #2: failed payments
    hasPurchaseRequest: false,
    isAnywhereMember: false,
    isPremiumMember: false,
    activeOrders: [
      { orderId: "SZ-30001", merchant: "Walmart", total: 199.99, perInstallment: 50.00, paidInstallments: 0, totalInstallments: 4, nextDueDate: "2026-02-15", status: "overdue", daysOverdue: 18 },
      { orderId: "SZ-30445", merchant: "Amazon", total: 89.99, perInstallment: 22.50, paidInstallments: 1, totalInstallments: 4, nextDueDate: "2026-02-20", status: "overdue", daysOverdue: 13 },
      { orderId: "SZ-30891", merchant: "Target", total: 149.99, perInstallment: 37.50, paidInstallments: 2, totalInstallments: 4, nextDueDate: "2026-03-10", status: "on_track" },
      { orderId: "SZ-31102", merchant: "GameStop", total: 59.99, perInstallment: 15.00, paidInstallments: 0, totalInstallments: 4, nextDueDate: "2026-03-20", status: "on_track" }
    ],
    declineHistory: [
      { id: "dec-012", date: "2026-03-04T09:00:00Z", merchantName: "Best Buy", amount: 499.99, code: "outstanding_failed_payments", status: "unresolved" },
      { id: "dec-013", date: "2026-03-02T17:30:00Z", merchantName: "Target", amount: 89.99, code: "unpaid_user_rescheduled_payment", status: "unresolved" },
      { id: "dec-014", date: "2026-02-28T12:00:00Z", merchantName: "Amazon", amount: 299.99, code: "insufficient_credit_limit", status: "unresolved" },
      { id: "dec-015", date: "2026-02-25T11:15:00Z", merchantName: "Walmart", amount: 149.99, code: "exceeded_max_open_orders", status: "unresolved" },
      { id: "dec-016", date: "2026-02-20T16:45:00Z", merchantName: "GameStop", amount: 59.99, code: "outstanding_failed_payments", status: "unresolved" }
    ],
    riskSignals: {
      newAccountRisk: false,
      failedPaymentRisk: true,     // Signal #2: multiple failed payments
      lowSpendingPowerRisk: true   // Signal #3: $45 < $100
    }
  },

  // User 5: Lisa — LOW SPENDING POWER only (Signal #3 only)
  "lisa-martinez-005": {
    userId: "lisa-martinez-005",
    name: "Lisa Martinez",
    email: "lisa.m@email.com",
    memberSince: "2025",
    accountAgeHours: 4380,
    sezzleScore: "Fair",
    availableSpendingPower: 65.00, // Signal #3: below $100
    totalSpendingPower: 250.00,
    overdueAmount: 0,
    rescheduledPayments: 0,
    failedPayments: 0,
    hasPurchaseRequest: true,
    isAnywhereMember: true,
    isPremiumMember: false,
    activeOrders: [
      { orderId: "SZ-31500", merchant: "Zara", total: 185.00, perInstallment: 46.25, paidInstallments: 1, totalInstallments: 4, nextDueDate: "2026-03-14", status: "on_track" },
      { orderId: "SZ-31700", merchant: "H&M", total: 92.00, perInstallment: 23.00, paidInstallments: 2, totalInstallments: 4, nextDueDate: "2026-03-18", status: "on_track" }
    ],
    declineHistory: [
      { id: "dec-020", date: "2026-03-01T11:00:00Z", merchantName: "Sephora", amount: 120.00, code: "insufficient_credit_limit", status: "unresolved" }
    ],
    riskSignals: {
      newAccountRisk: false,
      failedPaymentRisk: false,
      lowSpendingPowerRisk: true   // Signal #3: $65 < $100
    }
  }
};

const MOCK_DECLINE_CODES = {
  outstanding_failed_payments: {
    code: "outstanding_failed_payments",
    name: "Outstanding Failed Payments",
    currentMessage: "You currently have one or more outstanding payments past the due date. Please resolve any payment failure then try again.",
    category: "Account Health",
    actionable: true,
    aiResponse: {
      whyItHappened: "You have overdue payments on your Sezzle account. Until those are paid, Sezzle pauses new purchases to help you stay on track.",
      steps: ["Open the Sezzle app and go to 'My Orders'", "Find the order(s) marked as overdue or failed", "Pay the overdue amount — even a partial payment helps", "Once cleared, try your purchase again"],
      timeToFix: "5-10 minutes",
      canWeHelp: true
    }
  },
  unpaid_user_rescheduled_payment: {
    code: "unpaid_user_rescheduled_payment",
    name: "Unpaid Rescheduled Payment",
    currentMessage: "You have outstanding rescheduled payment(s). In order to place additional orders, you will need to pay all of your rescheduled payments.",
    category: "Account Health",
    actionable: true,
    aiResponse: {
      whyItHappened: "You rescheduled a payment earlier, but it still hasn't been paid. Sezzle needs that cleared before approving new orders.",
      steps: ["Open the Sezzle app and go to 'My Orders'", "Look for payments marked as 'Rescheduled'", "Pay all rescheduled payments in full", "Try your purchase again after payment clears"],
      timeToFix: "5-10 minutes",
      canWeHelp: true
    }
  },
  exceeded_max_open_orders: {
    code: "exceeded_max_open_orders",
    name: "Too Many Open Orders",
    currentMessage: "We cannot approve your purchase as you have already reached the maximum number of active orders. Please pay off an active order and try again.",
    category: "Account Health",
    actionable: true,
    aiResponse: {
      whyItHappened: "You've hit the maximum number of orders you can have open at the same time.",
      steps: ["Open the Sezzle app and check your active orders", "Pay off the order closest to completion", "Once an order is fully paid, your slot opens up", "Then try your new purchase again"],
      timeToFix: "Depends on your next payment date",
      canWeHelp: true
    }
  },
  insufficient_credit_limit: {
    code: "insufficient_credit_limit",
    name: "Over Spending Limit",
    currentMessage: "This order amount is above your available spending limit. As you make purchases and pay them back responsibly over time, we may increase your available limit with Sezzle.",
    category: "Spending Power",
    actionable: true,
    aiResponse: {
      whyItHappened: "This purchase costs more than your current available spending power.",
      steps: ["Check your available spending power in the Sezzle app", "Pay off or pay down an existing order to free up limit", "Or try a smaller purchase amount", "Your limit grows over time as you pay on time"],
      timeToFix: "Immediate if you pay down an order",
      canWeHelp: true
    }
  },
  locked_virtual_card: {
    code: "locked_virtual_card",
    name: "Virtual Card Locked",
    currentMessage: "We are unable to process your transaction at this time because your VC has been locked.",
    category: "Security",
    actionable: true,
    aiResponse: {
      whyItHappened: "Your virtual card was locked for security reasons.",
      steps: ["Open the Sezzle app or go to dashboard.sezzle.com", "Go to the Security page", "Unlock your virtual card", "Try your purchase again"],
      timeToFix: "2 minutes",
      canWeHelp: true
    }
  },
  unavailable_in_your_state: {
    code: "unavailable_in_your_state",
    name: "Unavailable in Your State",
    currentMessage: "Sezzle is temporarily unavailable. Please check back at a later time.",
    category: "Location",
    actionable: false,
    aiResponse: {
      whyItHappened: "Sezzle is not currently available in your state due to local regulations.",
      steps: ["This is a regulatory restriction based on your location", "Unfortunately there's no workaround at this time", "Check back periodically — Sezzle is expanding to more states"],
      timeToFix: "Not available at this time",
      canWeHelp: false
    }
  },
  merchant_lending_limit_over_time: {
    code: "merchant_lending_limit_over_time",
    name: "Merchant Lending Limit",
    currentMessage: "Sezzle is temporarily unavailable. Please check back at a later time.",
    category: "Merchant",
    actionable: false,
    aiResponse: {
      whyItHappened: "This merchant has reached their temporary lending limit with Sezzle.",
      steps: ["This is temporary and usually resets within a few hours", "Try again later today or tomorrow", "Your account is fine — you can still shop at other stores"],
      timeToFix: "Usually resets within hours",
      canWeHelp: false
    }
  },
  exceeds_new_customer_order_threshold: {
    code: "exceeds_new_customer_order_threshold",
    name: "New Customer Limit",
    currentMessage: "In our commitment to financial empowerment and responsible spending, only one transaction is allowed within the first 24 hours of your first purchase.",
    category: "New Account",
    actionable: true,
    aiResponse: {
      whyItHappened: "As a new Sezzle customer, you can only make one purchase in your first 24 hours.",
      steps: ["Wait 24 hours after your first purchase", "After that, you'll be able to shop normally", "In the meantime, explore stores in the Sezzle app"],
      timeToFix: "24 hours from your first purchase",
      canWeHelp: false
    }
  },
  voip: {
    code: "voip",
    name: "VOIP Phone Detected",
    currentMessage: "We cannot approve your application at this time. Please contact support.",
    category: "Verification",
    actionable: true,
    aiResponse: {
      whyItHappened: "Sezzle detected that your phone number is a VOIP (internet-based) number.",
      steps: ["Update your account with a real mobile phone number", "Go to your Sezzle account settings to update your phone", "If you believe this is an error, contact Sezzle support"],
      timeToFix: "5 minutes + support response time",
      canWeHelp: true
    }
  },
  other: {
    code: "other",
    name: "General Decline",
    currentMessage: "We cannot approve your application at this time based on the information you have provided.",
    category: "General",
    actionable: true,
    aiResponse: {
      whyItHappened: "Your purchase couldn't be approved. This could be due to incorrect account information.",
      steps: ["Double-check your name, address, and date of birth in the Sezzle app", "Make sure your linked payment method is valid and has funds", "If everything looks correct, contact Sezzle support for help"],
      timeToFix: "5-10 minutes",
      canWeHelp: true
    }
  }
};

// ============================================================
// State — are we using a real DB or mock data?
// ============================================================
let useDb = false;

// ============================================================
// PostgreSQL Schema Migration
// ============================================================
async function migrate() {
  console.log("Running PostgreSQL migrations...");

  await DB.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id              VARCHAR(64)    PRIMARY KEY,
      name                 VARCHAR(128)   NOT NULL,
      email                VARCHAR(256)   NOT NULL,
      member_since         VARCHAR(4)     NOT NULL,
      account_age_hours    INT            NOT NULL DEFAULT 8760,
      sezzle_score         VARCHAR(32)    NOT NULL,
      available_spending_power DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      total_spending_power     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      overdue_amount           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      rescheduled_payments     INT           NOT NULL DEFAULT 0,
      failed_payments          INT           NOT NULL DEFAULT 0,
      has_purchase_request     BOOLEAN       NOT NULL DEFAULT TRUE,
      is_anywhere_member       BOOLEAN       NOT NULL DEFAULT FALSE,
      is_premium_member        BOOLEAN       NOT NULL DEFAULT FALSE
    )
  `);

  await DB.query(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id           VARCHAR(32)    PRIMARY KEY,
      user_id            VARCHAR(64)    NOT NULL REFERENCES users(user_id),
      merchant           VARCHAR(128)   NOT NULL,
      total              DECIMAL(10,2)  NOT NULL,
      per_installment    DECIMAL(10,2)  NOT NULL,
      paid_installments  INT            NOT NULL DEFAULT 0,
      total_installments INT            NOT NULL DEFAULT 4,
      next_due_date      DATE           NOT NULL,
      status             VARCHAR(16)    NOT NULL DEFAULT 'on_track',
      days_overdue       INT
    )
  `);

  await DB.query(`
    CREATE TABLE IF NOT EXISTS decline_history (
      id              VARCHAR(32)    PRIMARY KEY,
      user_id         VARCHAR(64)    NOT NULL REFERENCES users(user_id),
      declined_at     TIMESTAMP      NOT NULL,
      merchant_name   VARCHAR(128)   NOT NULL,
      amount          DECIMAL(10,2)  NOT NULL,
      code            VARCHAR(64)    NOT NULL,
      status          VARCHAR(16)    NOT NULL DEFAULT 'unresolved',
      resolved_action VARCHAR(256)
    )
  `);

  await DB.query(`
    CREATE TABLE IF NOT EXISTS decline_codes (
      code            VARCHAR(64)    PRIMARY KEY,
      name            VARCHAR(128)   NOT NULL,
      current_message TEXT           NOT NULL,
      category        VARCHAR(64)    NOT NULL,
      actionable      BOOLEAN        NOT NULL DEFAULT TRUE,
      why_it_happened TEXT           NOT NULL,
      steps           JSONB          NOT NULL,
      time_to_fix     VARCHAR(64)    NOT NULL,
      can_we_help     BOOLEAN        NOT NULL DEFAULT TRUE
    )
  `);

  console.log("Schema ready.");
}

// ============================================================
// Seed demo data into PostgreSQL
// ============================================================
async function seed() {
  const { rows } = await DB.query("SELECT COUNT(*) AS count FROM users");
  if (parseInt(rows[0].count) > 0) return;

  console.log("Seeding database with demo data...");

  // Insert all mock users
  for (const user of Object.values(MOCK_USERS)) {
    await DB.query(
      `INSERT INTO users (user_id, name, email, member_since, account_age_hours, sezzle_score,
        available_spending_power, total_spending_power, overdue_amount,
        rescheduled_payments, failed_payments, has_purchase_request,
        is_anywhere_member, is_premium_member)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [user.userId, user.name, user.email, user.memberSince, user.accountAgeHours,
       user.sezzleScore, user.availableSpendingPower, user.totalSpendingPower,
       user.overdueAmount, user.rescheduledPayments, user.failedPayments,
       user.hasPurchaseRequest, user.isAnywhereMember, user.isPremiumMember]
    );

    for (const o of user.activeOrders) {
      await DB.query(
        `INSERT INTO orders (order_id, user_id, merchant, total, per_installment,
          paid_installments, total_installments, next_due_date, status, days_overdue)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [o.orderId, user.userId, o.merchant, o.total, o.perInstallment,
         o.paidInstallments, o.totalInstallments, o.nextDueDate, o.status, o.daysOverdue || null]
      );
    }

    for (const d of user.declineHistory) {
      await DB.query(
        `INSERT INTO decline_history (id, user_id, declined_at, merchant_name, amount, code, status, resolved_action)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [d.id, user.userId, d.date, d.merchantName, d.amount, d.code, d.status, d.resolvedAction || null]
      );
    }
  }

  // Insert decline codes
  for (const c of Object.values(MOCK_DECLINE_CODES)) {
    await DB.query(
      `INSERT INTO decline_codes (code, name, current_message, category, actionable, why_it_happened, steps, time_to_fix, can_we_help)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [c.code, c.name, c.currentMessage, c.category, c.actionable,
       c.aiResponse.whyItHappened, JSON.stringify(c.aiResponse.steps),
       c.aiResponse.timeToFix, c.aiResponse.canWeHelp]
    );
  }

  console.log("Seed complete — 5 users, 10 decline codes.");
}

// ============================================================
// initDb — call at server startup
// ============================================================
export async function initDb() {
  const pool = await InitDB();
  if (pool) {
    useDb = true;
    await migrate();
    await seed();
  } else {
    console.log("📋 Using in-memory mock data (no DB configured)");
  }
}

// ============================================================
// Query helpers — work with DB or mock data
// ============================================================

export async function getUser(userId) {
  if (!useDb) {
    // Mock mode
    return MOCK_USERS[userId] || MOCK_USERS["sarah-chen-001"];
  }

  // DB mode
  const { rows: [row] } = await DB.query("SELECT * FROM users WHERE user_id = $1", [userId]);
  const userRow = row || (await DB.query("SELECT * FROM users WHERE user_id = $1", ["sarah-chen-001"])).rows[0];

  const { rows: orders } = await DB.query("SELECT * FROM orders WHERE user_id = $1 ORDER BY next_due_date ASC", [userRow.user_id]);
  const { rows: history } = await DB.query("SELECT * FROM decline_history WHERE user_id = $1 ORDER BY declined_at DESC", [userRow.user_id]);

  const user = {
    userId:                 userRow.user_id,
    name:                   userRow.name,
    email:                  userRow.email,
    memberSince:            userRow.member_since,
    accountAgeHours:        userRow.account_age_hours,
    sezzleScore:            userRow.sezzle_score,
    availableSpendingPower: Number(userRow.available_spending_power),
    totalSpendingPower:     Number(userRow.total_spending_power),
    overdueAmount:          Number(userRow.overdue_amount),
    rescheduledPayments:    userRow.rescheduled_payments,
    failedPayments:         userRow.failed_payments,
    hasPurchaseRequest:     userRow.has_purchase_request,
    isAnywhereMember:       userRow.is_anywhere_member,
    isPremiumMember:        userRow.is_premium_member,
    activeOrders: orders.map(o => ({
      orderId: o.order_id, merchant: o.merchant, total: Number(o.total),
      perInstallment: Number(o.per_installment), paidInstallments: o.paid_installments,
      totalInstallments: o.total_installments,
      nextDueDate: o.next_due_date instanceof Date ? o.next_due_date.toISOString().split("T")[0] : o.next_due_date,
      status: o.status, daysOverdue: o.days_overdue ?? undefined
    })),
    declineHistory: history.map(d => ({
      id: d.id,
      date: d.declined_at instanceof Date ? d.declined_at.toISOString() : d.declined_at,
      merchantName: d.merchant_name, amount: Number(d.amount),
      code: d.code, status: d.status, resolvedAction: d.resolved_action ?? undefined
    }))
  };

  // Calculate risk signals
  user.riskSignals = {
    newAccountRisk:       user.accountAgeHours < 24 && user.activeOrders.length >= 1,
    failedPaymentRisk:    user.failedPayments > 0 || user.activeOrders.some(o => o.status === "overdue"),
    lowSpendingPowerRisk: user.availableSpendingPower < 100
  };

  return user;
}

export async function lookupDeclineCode(code) {
  if (!useDb) {
    // Mock mode
    return MOCK_DECLINE_CODES[code] || MOCK_DECLINE_CODES["other"];
  }

  // DB mode
  const { rows: [row] } = await DB.query("SELECT * FROM decline_codes WHERE code = $1", [code]);
  const r = row || (await DB.query("SELECT * FROM decline_codes WHERE code = $1", ["other"])).rows[0];

  return {
    code:           r.code,
    name:           r.name,
    currentMessage: r.current_message,
    category:       r.category,
    actionable:     r.actionable,
    aiResponse: {
      whyItHappened: r.why_it_happened,
      steps:         typeof r.steps === "string" ? JSON.parse(r.steps) : r.steps,
      timeToFix:     r.time_to_fix,
      canWeHelp:     r.can_we_help
    }
  };
}
