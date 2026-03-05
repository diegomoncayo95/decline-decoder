import { InitDB, DB } from "./connection.js";

// ============================================================
// Migrate — mirrors gorm.Migrate()
// Runs CREATE TABLE IF NOT EXISTS for all tables.
// ============================================================
async function migrate() {
  console.log("Initializing DB schema...");

  await DB.execute(`
    CREATE TABLE IF NOT EXISTS users (
      user_id              VARCHAR(64)    NOT NULL PRIMARY KEY,
      name                 VARCHAR(128)   NOT NULL,
      email                VARCHAR(256)   NOT NULL,
      member_since         VARCHAR(4)     NOT NULL,
      sezzle_score         VARCHAR(32)    NOT NULL,
      available_spending_power DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      total_spending_power     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      overdue_amount           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      rescheduled_payments     INT           NOT NULL DEFAULT 0,
      failed_payments          INT           NOT NULL DEFAULT 0,
      has_purchase_request     TINYINT(1)    NOT NULL DEFAULT 1,
      is_anywhere_member       TINYINT(1)    NOT NULL DEFAULT 0,
      is_premium_member        TINYINT(1)    NOT NULL DEFAULT 0
    )
  `);

  await DB.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id           VARCHAR(32)    NOT NULL PRIMARY KEY,
      user_id            VARCHAR(64)    NOT NULL,
      merchant           VARCHAR(128)   NOT NULL,
      total              DECIMAL(10,2)  NOT NULL,
      per_installment    DECIMAL(10,2)  NOT NULL,
      paid_installments  INT            NOT NULL DEFAULT 0,
      total_installments INT            NOT NULL DEFAULT 4,
      next_due_date      DATE           NOT NULL,
      status             VARCHAR(16)    NOT NULL DEFAULT 'on_track',
      days_overdue       INT            NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `);

  await DB.execute(`
    CREATE TABLE IF NOT EXISTS decline_history (
      id              VARCHAR(32)    NOT NULL PRIMARY KEY,
      user_id         VARCHAR(64)    NOT NULL,
      declined_at     DATETIME       NOT NULL,
      merchant_name   VARCHAR(128)   NOT NULL,
      amount          DECIMAL(10,2)  NOT NULL,
      code            VARCHAR(64)    NOT NULL,
      status          VARCHAR(16)    NOT NULL DEFAULT 'unresolved',
      resolved_action VARCHAR(256)   NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `);

  await DB.execute(`
    CREATE TABLE IF NOT EXISTS decline_codes (
      code            VARCHAR(64)    NOT NULL PRIMARY KEY,
      name            VARCHAR(128)   NOT NULL,
      current_message TEXT           NOT NULL,
      category        VARCHAR(64)    NOT NULL,
      actionable      TINYINT(1)     NOT NULL DEFAULT 1,
      why_it_happened TEXT           NOT NULL,
      steps           JSON           NOT NULL,
      time_to_fix     VARCHAR(64)    NOT NULL,
      can_we_help     TINYINT(1)     NOT NULL DEFAULT 1
    )
  `);

  console.log("Schema ready.");
}

// ============================================================
// Seed — inserts demo data if tables are empty
// ============================================================
async function seed() {
  const [[{ count }]] = await DB.execute("SELECT COUNT(*) AS count FROM users");
  if (count > 0) return;

  console.log("Seeding database with demo data...");

  // ── Users ───────────────────────────────────────────────────
  await DB.execute(`
    INSERT INTO users VALUES
      -- Sarah Chen: moderate health, 1 overdue order
      ('sarah-chen-001', 'Sarah Chen',   'sarah.chen@email.com',   '2023', 'Good',      187.50, 500.00, 106.25, 0, 0, 1, 1, 0),
      -- Marcus Johnson: new customer, clean record
      ('marcus-johnson-002', 'Marcus Johnson', 'marcus.j@email.com', '2026', 'Fair',    150.00, 150.00,   0.00, 0, 0, 1, 0, 0),
      -- Priya Patel: premium member, excellent standing
      ('priya-patel-003',  'Priya Patel',  'priya.patel@email.com', '2021', 'Excellent', 750.00, 1000.00, 0.00, 0, 0, 1, 1, 1),
      -- Derek Williams: high-risk, multiple overdue, no purchase request
      ('derek-williams-004', 'Derek Williams', 'derek.w@email.com', '2024', 'Poor',        0.00, 200.00,  72.50, 1, 1, 0, 0, 0)
  `);

  // ── Orders ──────────────────────────────────────────────────
  await DB.execute(`
    INSERT INTO orders VALUES
      -- Sarah Chen's orders
      ('SZ-29481', 'sarah-chen-001', 'Target',  249.99, 62.50, 2, 4, '2026-03-12', 'on_track',  NULL),
      ('SZ-30872', 'sarah-chen-001', 'Samsung', 425.00, 106.25, 1, 4, '2026-03-03', 'overdue',   2),
      ('SZ-31203', 'sarah-chen-001', 'SHEIN',    54.99, 13.75, 3, 4, '2026-03-20', 'on_track',  NULL),
      -- Marcus Johnson's orders
      ('SZ-31980', 'marcus-johnson-002', 'Nike', 120.00, 30.00, 1, 4, '2026-03-18', 'on_track', NULL),
      -- Priya Patel's orders
      ('SZ-28441', 'priya-patel-003', 'Apple Store', 799.00, 199.75, 3, 4, '2026-03-10', 'on_track', NULL),
      ('SZ-29903', 'priya-patel-003', 'Nordstrom',   312.00,  78.00, 2, 4, '2026-03-15', 'on_track', NULL),
      -- Derek Williams's orders
      ('SZ-30001', 'derek-williams-004', 'Walmart',  199.99, 50.00, 0, 4, '2026-02-15', 'overdue', 18),
      ('SZ-30445', 'derek-williams-004', 'Amazon',    89.99, 22.50, 1, 4, '2026-02-20', 'overdue', 13),
      ('SZ-30891', 'derek-williams-004', 'Target',   149.99, 37.50, 2, 4, '2026-03-10', 'on_track', NULL),
      ('SZ-31102', 'derek-williams-004', 'GameStop',  59.99, 15.00, 0, 4, '2026-03-20', 'on_track', NULL)
  `);

  // ── Decline History ─────────────────────────────────────────
  await DB.execute(`
    INSERT INTO decline_history VALUES
      -- Sarah Chen
      ('dec-001', 'sarah-chen-001',   '2026-03-03 14:32:00', 'Best Buy',   349.99, 'insufficient_credit_limit',        'unresolved',  NULL),
      ('dec-002', 'sarah-chen-001',   '2026-02-28 10:15:00', 'Amazon',      89.99, 'outstanding_failed_payments',      'resolved',    'Paid overdue installment'),
      ('dec-003', 'sarah-chen-001',   '2026-02-15 16:45:00', 'Hiwingo Ltd', 50.00, 'insufficient_credit_limit',        'resolved',    'Lowered purchase amount'),
      ('dec-004', 'sarah-chen-001',   '2026-01-22 09:20:00', 'Target',     124.50, 'other',                            'resolved',    'Created purchase request in app'),
      ('dec-005', 'sarah-chen-001',   '2026-01-15 13:10:00', 'PayPal',     200.00, 'other',                            'unresolvable','PayPal is permanently blocked'),
      ('dec-006', 'sarah-chen-001',   '2026-01-10 11:30:00', 'GameStop',    69.99, 'other',                            'resolved',    'Waited 24 hours'),
      -- Marcus Johnson
      ('dec-007', 'marcus-johnson-002','2026-02-01 15:00:00', 'Foot Locker',180.00, 'exceeds_new_customer_order_threshold','resolved', 'Waited 24 hours'),
      ('dec-008', 'marcus-johnson-002','2026-01-30 11:45:00', 'Adidas',      95.00, 'insufficient_credit_limit',        'resolved',    'Lowered purchase amount'),
      -- Priya Patel
      ('dec-009', 'priya-patel-003',  '2025-11-20 08:30:00', 'Walmart',    450.00, 'insufficient_credit_limit',        'resolved',    'Paid down existing order'),
      ('dec-010', 'priya-patel-003',  '2025-08-14 14:00:00', 'Target',     300.00, 'exceeded_max_open_orders',         'resolved',    'Paid off an order'),
      ('dec-011', 'priya-patel-003',  '2025-05-02 10:15:00', 'Home Depot',  89.99, 'locked_virtual_card',              'resolved',    'Unlocked card in app'),
      -- Derek Williams
      ('dec-012', 'derek-williams-004','2026-03-04 09:00:00', 'Best Buy',   499.99, 'outstanding_failed_payments',     'unresolved',  NULL),
      ('dec-013', 'derek-williams-004','2026-03-02 17:30:00', 'Target',      89.99, 'unpaid_user_rescheduled_payment',  'unresolved',  NULL),
      ('dec-014', 'derek-williams-004','2026-02-28 12:00:00', 'Amazon',     299.99, 'insufficient_credit_limit',        'unresolved',  NULL),
      ('dec-015', 'derek-williams-004','2026-02-25 11:15:00', 'Walmart',    149.99, 'exceeded_max_open_orders',         'unresolved',  NULL),
      ('dec-016', 'derek-williams-004','2026-02-20 16:45:00', 'GameStop',    59.99, 'outstanding_failed_payments',     'unresolved',  NULL),
      ('dec-017', 'derek-williams-004','2026-02-15 09:30:00', 'Nike',        89.99, 'unpaid_user_rescheduled_payment',  'resolved',    'Paid rescheduled payment'),
      ('dec-018', 'derek-williams-004','2026-02-10 14:00:00', 'Apple',      399.99, 'insufficient_credit_limit',        'resolved',    'Lowered purchase amount'),
      ('dec-019', 'derek-williams-004','2026-02-05 11:00:00', 'Samsung',    249.99, 'exceeded_max_open_orders',         'resolved',    'Paid off an order')
  `);

  // ── Decline Codes ────────────────────────────────────────────
  const codes = [
    {
      code: "outstanding_failed_payments",
      name: "Outstanding Failed Payments",
      current_message: "You currently have one or more outstanding payments past the due date. Please resolve any payment failure then try again.",
      category: "Account Health",
      actionable: 1,
      why_it_happened: "You have overdue payments on your Sezzle account. Until those are paid, Sezzle pauses new purchases to help you stay on track.",
      steps: JSON.stringify(["Open the Sezzle app and go to 'My Orders'", "Find the order(s) marked as overdue or failed", "Pay the overdue amount — even a partial payment helps", "Once cleared, try your purchase again"]),
      time_to_fix: "5-10 minutes",
      can_we_help: 1
    },
    {
      code: "unpaid_user_rescheduled_payment",
      name: "Unpaid Rescheduled Payment",
      current_message: "You have outstanding rescheduled payment(s). In order to place additional orders, you will need to pay all of your rescheduled payments.",
      category: "Account Health",
      actionable: 1,
      why_it_happened: "You rescheduled a payment earlier, but it still hasn't been paid. Sezzle needs that cleared before approving new orders.",
      steps: JSON.stringify(["Open the Sezzle app and go to 'My Orders'", "Look for payments marked as 'Rescheduled'", "Pay all rescheduled payments in full", "Try your purchase again after payment clears"]),
      time_to_fix: "5-10 minutes",
      can_we_help: 1
    },
    {
      code: "exceeded_max_open_orders",
      name: "Too Many Open Orders",
      current_message: "We cannot approve your purchase as you have already reached the maximum number of active orders. Please pay off an active order and try again.",
      category: "Account Health",
      actionable: 1,
      why_it_happened: "You've hit the maximum number of orders you can have open at the same time. This limit exists to help you manage your payments.",
      steps: JSON.stringify(["Open the Sezzle app and check your active orders", "Pay off the order closest to completion (fewest installments left)", "Once an order is fully paid, your slot opens up", "Then try your new purchase again"]),
      time_to_fix: "Depends on your next payment date",
      can_we_help: 1
    },
    {
      code: "insufficient_credit_limit",
      name: "Over Spending Limit",
      current_message: "This order amount is above your available spending limit. As you make purchases and pay them back responsibly over time, we may increase your available limit with Sezzle.",
      category: "Spending Power",
      actionable: 1,
      why_it_happened: "This purchase costs more than your current available spending power. Your limit is based on your payment history with Sezzle.",
      steps: JSON.stringify(["Check your available spending power in the Sezzle app", "Pay off or pay down an existing order to free up limit", "Or try a smaller purchase amount that fits your current limit", "Your limit grows over time as you pay on time"]),
      time_to_fix: "Immediate if you pay down an order",
      can_we_help: 1
    },
    {
      code: "locked_virtual_card",
      name: "Virtual Card Locked",
      current_message: "We are unable to process your transaction at this time because your VC has been locked. Please visit the Security page on your Sezzle Dashboard to unlock your card and retry.",
      category: "Security",
      actionable: 1,
      why_it_happened: "Your virtual card was locked for security reasons. This can happen if there was unusual activity or you locked it yourself.",
      steps: JSON.stringify(["Open the Sezzle app or go to dashboard.sezzle.com", "Go to the Security page", "Unlock your virtual card", "Try your purchase again"]),
      time_to_fix: "2 minutes",
      can_we_help: 1
    },
    {
      code: "unavailable_in_your_state",
      name: "Unavailable in Your State",
      current_message: "Sezzle is temporarily unavailable. Please check back at a later time.",
      category: "Location",
      actionable: 0,
      why_it_happened: "Sezzle is not currently available in your state due to local regulations.",
      steps: JSON.stringify(["This is a regulatory restriction based on your location", "Unfortunately there's no workaround at this time", "Check back periodically — Sezzle is expanding to more states"]),
      time_to_fix: "Not available at this time",
      can_we_help: 0
    },
    {
      code: "merchant_lending_limit_over_time",
      name: "Merchant Lending Limit",
      current_message: "Sezzle is temporarily unavailable. Please check back at a later time.",
      category: "Merchant",
      actionable: 0,
      why_it_happened: "This merchant has reached their temporary lending limit with Sezzle. This is not about your account — it's a merchant-level cap.",
      steps: JSON.stringify(["This is temporary and usually resets within a few hours", "Try again later today or tomorrow", "Your account is fine — you can still shop at other stores"]),
      time_to_fix: "Usually resets within hours",
      can_we_help: 0
    },
    {
      code: "exceeds_new_customer_order_threshold",
      name: "New Customer Limit",
      current_message: "In our commitment to financial empowerment and responsible spending, only one transaction is allowed within the first 24 hours of your first purchase.",
      category: "New Account",
      actionable: 1,
      why_it_happened: "As a new Sezzle customer, you can only make one purchase in your first 24 hours. This is a safety measure to protect your account.",
      steps: JSON.stringify(["Wait 24 hours after your first purchase", "After that, you'll be able to shop normally", "In the meantime, explore stores in the Sezzle app"]),
      time_to_fix: "24 hours from your first purchase",
      can_we_help: 0
    },
    {
      code: "voip",
      name: "VOIP Phone Detected",
      current_message: "We cannot approve your application at this time. Please contact support.",
      category: "Verification",
      actionable: 1,
      why_it_happened: "Sezzle detected that your phone number is a VOIP (internet-based) number. Sezzle requires a real mobile phone number for verification.",
      steps: JSON.stringify(["Update your account with a real mobile phone number (not Google Voice, TextNow, etc.)", "Go to your Sezzle account settings to update your phone", "If you believe this is an error, contact Sezzle support"]),
      time_to_fix: "5 minutes + support response time",
      can_we_help: 1
    },
    {
      code: "other",
      name: "General Decline",
      current_message: "We cannot approve your application at this time based on the information you have provided. Please verify all information was entered correctly upon account set up.",
      category: "General",
      actionable: 1,
      why_it_happened: "Your purchase couldn't be approved. This could be due to incorrect account information or other factors in our approval process.",
      steps: JSON.stringify(["Double-check your name, address, and date of birth in the Sezzle app", "Make sure your linked payment method is valid and has funds", "If everything looks correct, contact Sezzle support for help"]),
      time_to_fix: "5-10 minutes",
      can_we_help: 1
    }
  ];

  for (const c of codes) {
    await DB.execute(
      `INSERT INTO decline_codes
         (code, name, current_message, category, actionable, why_it_happened, steps, time_to_fix, can_we_help)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.code, c.name, c.current_message, c.category, c.actionable, c.why_it_happened, c.steps, c.time_to_fix, c.can_we_help]
    );
  }

  console.log("Seed complete.");
}

// ============================================================
// initDb — call this at server startup before app.listen()
// mirrors: gorm.InitDB() + gorm.Migrate() in salesforce main.go
// ============================================================
export async function initDb() {
  await InitDB();
  await migrate();
  await seed();
}

// ============================================================
// Query helpers — called from routes
// ============================================================

export async function getUser(userId) {
  const [[user]] = await DB.execute(
    "SELECT * FROM users WHERE user_id = ?",
    [userId]
  );

  // Fallback to demo user if ID not found
  const row = user ?? (await DB.execute(
    "SELECT * FROM users WHERE user_id = ?",
    ["sarah-chen-001"]
  ))[0][0];

  const [orders] = await DB.execute(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY next_due_date ASC",
    [row.user_id]
  );

  const [history] = await DB.execute(
    "SELECT * FROM decline_history WHERE user_id = ? ORDER BY declined_at DESC",
    [row.user_id]
  );

  return {
    userId:                 row.user_id,
    name:                   row.name,
    email:                  row.email,
    memberSince:            row.member_since,
    sezzleScore:            row.sezzle_score,
    availableSpendingPower: Number(row.available_spending_power),
    totalSpendingPower:     Number(row.total_spending_power),
    overdueAmount:          Number(row.overdue_amount),
    rescheduledPayments:    row.rescheduled_payments,
    failedPayments:         row.failed_payments,
    hasPurchaseRequest:     Boolean(row.has_purchase_request),
    isAnywhereMember:       Boolean(row.is_anywhere_member),
    isPremiumMember:        Boolean(row.is_premium_member),
    activeOrders: orders.map(o => ({
      orderId:           o.order_id,
      merchant:          o.merchant,
      total:             Number(o.total),
      perInstallment:    Number(o.per_installment),
      paidInstallments:  o.paid_installments,
      totalInstallments: o.total_installments,
      nextDueDate:       o.next_due_date instanceof Date
                           ? o.next_due_date.toISOString().split("T")[0]
                           : o.next_due_date,
      status:            o.status,
      daysOverdue:       o.days_overdue ?? undefined
    })),
    declineHistory: history.map(d => ({
      id:             d.id,
      date:           d.declined_at instanceof Date
                        ? d.declined_at.toISOString()
                        : d.declined_at,
      merchantName:   d.merchant_name,
      amount:         Number(d.amount),
      code:           d.code,
      status:         d.status,
      resolvedAction: d.resolved_action ?? undefined
    }))
  };
}

export async function lookupDeclineCode(code) {
  const [[row]] = await DB.execute(
    "SELECT * FROM decline_codes WHERE code = ?",
    [code]
  );

  // Fallback to "other" for unknown codes
  const r = row ?? (await DB.execute(
    "SELECT * FROM decline_codes WHERE code = ?",
    ["other"]
  ))[0][0];

  return {
    code:           r.code,
    name:           r.name,
    currentMessage: r.current_message,
    category:       r.category,
    actionable:     Boolean(r.actionable),
    aiResponse: {
      whyItHappened: r.why_it_happened,
      steps:         typeof r.steps === "string" ? JSON.parse(r.steps) : r.steps,
      timeToFix:     r.time_to_fix,
      canWeHelp:     Boolean(r.can_we_help)
    }
  };
}
