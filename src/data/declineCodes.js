// ============================================================
// REAL Sezzle Decline Codes — from internal SP documentation
// Source: card_authorizations.error_message in sezzle_card_production
// ============================================================

export const sezzleDeclines = {
  // --- TOP 10 by weekly volume ---
  purchase_request_not_present: {
    name: "No Purchase Request",
    category: "Setup Required",
    weeklyVolume: 110000,
    cardType: "Multi use",
    actionable: true,
    plainLanguage: "You need to create a purchase request in the Sezzle app before using your virtual card.",
    whatToDo: "Open the Sezzle app, go to your virtual card, and create a new purchase request. Then try your purchase again.",
    impact: "This doesn't affect your Sezzle account at all — it's just a setup step that's needed before each purchase with a multi-use card."
  },
  down_payment_declined: {
    name: "Down Payment Failed",
    category: "Payment Method",
    weeklyVolume: 69000,
    cardType: "Multi use and Single use",
    actionable: true,
    plainLanguage: "Your linked payment method for the down payment was declined by your bank.",
    whatToDo: "Check that your linked debit card or bank account has enough funds for the down payment. You can also try a different payment method in the Sezzle app.",
    impact: "This doesn't affect your Sezzle score. It's an issue with your linked bank account or card, not with Sezzle."
  },
  purchase_request_is_required: {
    name: "Purchase Request Needed",
    category: "Setup Required",
    weeklyVolume: 29000,
    cardType: "Single use",
    actionable: true,
    plainLanguage: "Your single-use card needs a purchase request before it can be used.",
    whatToDo: "Open the Sezzle app and create a purchase request for this merchant. Then use the new single-use card number at checkout.",
    impact: "No impact on your account. This is a normal step for single-use virtual cards."
  },
  merchant_match_is_exclude: {
    name: "Store Not Available",
    category: "Merchant",
    weeklyVolume: 20000,
    cardType: "Multi use and Single use",
    actionable: false,
    plainLanguage: "This specific merchant is not available for Sezzle purchases. This includes merchants like PayPal or competitor buy-now-pay-later services.",
    whatToDo: "Unfortunately, Sezzle can't be used at this store. Try shopping at a different merchant — you can find Sezzle-compatible stores in the app.",
    impact: "This is a permanent restriction on this specific merchant, not something that will change."
  },
  outstanding_failed_payments: {
    name: "Outstanding Payments",
    category: "Account Health",
    weeklyVolume: 17000,
    cardType: "Multi use and Single use",
    actionable: true,
    plainLanguage: "You have unpaid late payments on your account that need to be cleared before you can make new purchases.",
    whatToDo: "Open the Sezzle app and pay off all your late payments. Once they're cleared, you'll be able to shop again.",
    impact: "Late payments can affect your Sezzle purchasing power. Paying them off quickly will restore your ability to shop."
  },
  shopper_anywhere_preview: {
    name: "Anywhere Membership Needed",
    category: "Membership",
    weeklyVolume: 16000,
    cardType: "Multi use and Single use",
    actionable: true,
    plainLanguage: "This merchant is part of Sezzle Anywhere, but you're not a member yet. You're eligible to join!",
    whatToDo: "Open the Sezzle app and join Sezzle Anywhere. Once you're a member, you can shop at this merchant.",
    impact: "You're eligible for Anywhere — joining is quick and will unlock many more stores."
  },
  insufficient_credit_limit: {
    name: "Over Spending Limit",
    category: "Spending Power",
    weeklyVolume: 13000,
    cardType: "Multi use and Single use",
    actionable: true,
    plainLanguage: "This purchase exceeds your available spending power right now.",
    whatToDo: "You can lower your purchase amount, or pay off some of your existing orders to free up spending power. Check your available balance in the Sezzle app.",
    impact: "Your spending power updates as you make payments. Paying off an existing order will increase your available balance."
  },
  MCC_is_blocked: {
    name: "Store Category Blocked",
    category: "Merchant",
    weeklyVolume: 12000,
    cardType: "Multi use and Single use",
    actionable: false,
    plainLanguage: "This type of store isn't available for Sezzle purchases. Certain merchant categories are restricted.",
    whatToDo: "Sezzle can't be used at stores in this category. Try shopping at a different type of store — check the Sezzle app to find compatible merchants.",
    impact: "This is a category-level restriction and won't change. It applies to all stores of this type."
  },
  unpaid_user_rescheduled_payment: {
    name: "Rescheduled Payment Due",
    category: "Account Health",
    weeklyVolume: 8200,
    cardType: "Multi use and Single use",
    actionable: true,
    plainLanguage: "You have rescheduled payments that haven't been paid yet. These need to be cleared before you can place new orders.",
    whatToDo: "Open the Sezzle app and pay off your rescheduled payments. Once they're cleared, you can shop again.",
    impact: "Rescheduled payments are treated as overdue. Clearing them will restore your shopping ability."
  },
  authorization_rate_limit_exceeded: {
    name: "Too Many Attempts",
    category: "Rate Limit",
    weeklyVolume: 7400,
    cardType: "Multi use and Single use",
    actionable: true,
    plainLanguage: "You've been declined 8 times at this merchant. There's a temporary 24-hour cooldown to protect your account.",
    whatToDo: "Wait 24 hours, then try again. This cooldown resets automatically.",
    impact: "This is a temporary safety measure. It doesn't affect your Sezzle score or spending power."
  },
  invalid_country: {
    name: "International Store",
    category: "Location",
    weeklyVolume: 5100,
    cardType: "Multi use and Single use",
    actionable: false,
    plainLanguage: "The Sezzle Virtual Card can only be used at merchants in the United States and Canada.",
    whatToDo: "This merchant is located outside the US/Canada. Try shopping at a US-based merchant instead.",
    impact: "This is a geographic restriction. The Sezzle Virtual Card only works at US and Canadian merchants."
  },

  // --- Lower volume but still important ---
  shopper_not_allowed_anywhere_merchant: {
    name: "Not an Anywhere Member",
    category: "Membership",
    weeklyVolume: 10000,
    cardType: "Multi use and Single use",
    actionable: false,
    plainLanguage: "This store requires Sezzle Anywhere membership, and you're not currently eligible.",
    whatToDo: "Visit the Sezzle app to find stores where you can shop. You may become eligible for Anywhere in the future.",
    impact: "Eligibility for Anywhere is based on your account history. Keep making on-time payments to improve your chances."
  },
  shopper_premium_preview: {
    name: "Premium Membership Needed",
    category: "Membership",
    weeklyVolume: 7000,
    cardType: "Multi use",
    actionable: true,
    plainLanguage: "This merchant is part of Sezzle Premium. You're eligible to join!",
    whatToDo: "Open the Sezzle app and join Sezzle Premium. Once you're a member, you can shop at this merchant.",
    impact: "You're eligible for Premium — joining will unlock this and many other stores."
  },
  pending_id_verification: {
    name: "ID Verification Required",
    category: "Security",
    weeklyVolume: 700,
    cardType: "Multi use and Single use",
    actionable: true,
    plainLanguage: "For your security, we need to verify your identity before you can continue shopping.",
    whatToDo: "Go to your Sezzle account and complete the identity verification process. This usually takes just a few minutes.",
    impact: "This is a one-time security check. Once verified, you won't need to do it again."
  },
  authorizing_order_timed_out: {
    name: "Connection Timed Out",
    category: "Technical",
    weeklyVolume: 1600,
    cardType: "Multi use and Single use",
    actionable: true,
    plainLanguage: "The authorization process took too long and timed out. This is a temporary technical issue.",
    whatToDo: "Just try placing your order again. This is usually a one-time glitch.",
    impact: "This wasn't caused by anything on your end. Your account is fine."
  },
  over_max_merchant_open_order_count: {
    name: "Too Many Open Orders",
    category: "Account Health",
    weeklyVolume: 350,
    cardType: "Multi use and Single use",
    actionable: true,
    plainLanguage: "You've reached the maximum number of open orders with this merchant.",
    whatToDo: "Pay off one of your existing orders with this merchant, then try again.",
    impact: "This limit is per-merchant. You can still shop at other stores."
  },
  exceeded_thirty_day_order_amount: {
    name: "Monthly Limit Reached",
    category: "Spending Power",
    weeklyVolume: 190,
    cardType: "Multi use",
    actionable: true,
    plainLanguage: "You've reached your Sezzle order limit for the last 30 days.",
    whatToDo: "Wait a few days for older orders to fall outside the 30-day window, then try again.",
    impact: "This is a rolling 30-day limit that resets as older orders age out."
  },
  sezzle_pay_error_500: {
    name: "System Error",
    category: "Technical",
    weeklyVolume: 250,
    cardType: "Multi use and Single use",
    actionable: true,
    plainLanguage: "Sezzle is experiencing a temporary system issue.",
    whatToDo: "Please try again in a few minutes. If it keeps happening, contact Sezzle support.",
    impact: "This is on our end, not yours. Your account is not affected."
  }
};

// ============================================================
// Marqeta (Issuer) Decline Codes
// Source: card network responses via Marqeta
// ============================================================

export const marqetaDeclines = {
  "1919": {
    name: "Card Terminated",
    category: "Card Status",
    weeklyVolume: 210000,
    actionable: true,
    plainLanguage: "Your virtual card has been terminated and can no longer be used for purchases.",
    whatToDo: "Remove the virtual card from your wallet (Apple Pay, Google Pay, or browser), then re-add it from the Sezzle app. The new card will work immediately.",
    impact: "This is a card status issue, not an account issue. Re-adding the card fixes it."
  },
  "1874": {
    name: "Expiration Date Mismatch",
    category: "Card Details",
    weeklyVolume: 3100,
    actionable: true,
    plainLanguage: "The expiration date entered at checkout doesn't match your virtual card.",
    whatToDo: "Open the Sezzle app, check your virtual card details, and make sure the expiration date matches exactly what you entered at checkout.",
    impact: "No impact on your account. Just a data entry issue."
  },
  "1864": {
    name: "International Transaction Blocked",
    category: "Location",
    weeklyVolume: 2400,
    actionable: false,
    plainLanguage: "This merchant is located outside the United States, Canada, or US Territories, so the Sezzle Virtual Card can't be used here.",
    whatToDo: "The Sezzle Virtual Card is only available at merchants in the US, Canada, and US Territories. Try a US-based merchant instead.",
    impact: "This is a geographic restriction on the card network level."
  },
  "1915": {
    name: "Invalid Security Code (CVV)",
    category: "Card Details",
    weeklyVolume: 1900,
    actionable: true,
    plainLanguage: "The security code (CVV) you entered doesn't match your virtual card.",
    whatToDo: "Open the Sezzle app, check the CVV on your virtual card, and re-enter it carefully at checkout.",
    impact: "No impact on your account. Just double-check the 3-digit code on the back of your virtual card."
  },
  "1016": {
    name: "Insufficient Funds",
    category: "Spending Power",
    weeklyVolume: null,
    actionable: true,
    plainLanguage: "Your virtual card doesn't have enough balance to cover this purchase.",
    whatToDo: "Try lowering your purchase amount, or pay off some existing orders to free up spending power.",
    impact: "Your spending power updates as you make payments on existing orders."
  },
  "1821": {
    name: "Invalid Merchant",
    category: "Merchant",
    weeklyVolume: 700,
    actionable: false,
    plainLanguage: "This merchant is not recognized by the card network.",
    whatToDo: "This is a rare issue. Try the purchase again, or try a different merchant.",
    impact: "This is unusual and typically a one-time issue."
  }
};

// ============================================================
// Lookup helpers
// ============================================================

export function lookupDeclineCode(code) {
  // Check Sezzle internal codes first
  if (sezzleDeclines[code]) {
    return { source: "sezzle", code, ...sezzleDeclines[code] };
  }

  // Check Marqeta codes
  if (marqetaDeclines[code]) {
    return { source: "marqeta", code, ...marqetaDeclines[code] };
  }

  // Unknown code — return a helpful fallback
  return {
    source: "unknown",
    code,
    name: "Unknown Decline",
    category: "Unknown",
    weeklyVolume: null,
    actionable: true,
    plainLanguage: "Your transaction was declined, but we couldn't identify the specific reason.",
    whatToDo: "Try the purchase again. If it keeps failing, contact Sezzle support for help.",
    impact: "We're looking into this. Your account should not be affected."
  };
}
