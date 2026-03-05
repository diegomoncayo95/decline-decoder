// ============================================================
// Decline Decoder — Scoped Decline Codes (Elijah's 10)
// These are the codes we're targeting for the hackathon MVP
// ============================================================

export const declineCodes = {

  outstanding_failed_payments: {
    name: "Outstanding Failed Payments",
    currentMessage: "You currently have one or more outstanding payments past the due date. Please resolve any payment failure then try again.",
    category: "Account Health",
    actionable: true,
    aiResponse: {
      whyItHappened: "You have overdue payments on your Sezzle account. Until those are paid, Sezzle pauses new purchases to help you stay on track.",
      steps: [
        "Open the Sezzle app and go to 'My Orders'",
        "Find the order(s) marked as overdue or failed",
        "Pay the overdue amount — even a partial payment helps",
        "Once cleared, try your purchase again"
      ],
      timeToFix: "5-10 minutes",
      canWeHelp: true
    }
  },

  unpaid_user_rescheduled_payment: {
    name: "Unpaid Rescheduled Payment",
    currentMessage: "You have outstanding rescheduled payment(s). In order to place additional orders, you will need to pay all of your rescheduled payments.",
    category: "Account Health",
    actionable: true,
    aiResponse: {
      whyItHappened: "You rescheduled a payment earlier, but it still hasn't been paid. Sezzle needs that cleared before approving new orders.",
      steps: [
        "Open the Sezzle app and go to 'My Orders'",
        "Look for payments marked as 'Rescheduled'",
        "Pay all rescheduled payments in full",
        "Try your purchase again after payment clears"
      ],
      timeToFix: "5-10 minutes",
      canWeHelp: true
    }
  },

  exceeded_max_open_orders: {
    name: "Too Many Open Orders",
    currentMessage: "We cannot approve your purchase as you have already reached the maximum number of active orders. Please pay off an active order and try again.",
    category: "Account Health",
    actionable: true,
    aiResponse: {
      whyItHappened: "You've hit the maximum number of orders you can have open at the same time. This limit exists to help you manage your payments.",
      steps: [
        "Open the Sezzle app and check your active orders",
        "Pay off the order closest to completion (fewest installments left)",
        "Once an order is fully paid, your slot opens up",
        "Then try your new purchase again"
      ],
      timeToFix: "Depends on your next payment date",
      canWeHelp: true
    }
  },

  insufficient_credit_limit: {
    name: "Over Spending Limit",
    currentMessage: "This order amount is above your available spending limit. As you make purchases and pay them back responsibly over time, we may increase your available limit with Sezzle. Paying off outstanding orders in your customer dashboard will free up your available limit.",
    category: "Spending Power",
    actionable: true,
    aiResponse: {
      whyItHappened: "This purchase costs more than your current available spending power. Your limit is based on your payment history with Sezzle.",
      steps: [
        "Check your available spending power in the Sezzle app",
        "Pay off or pay down an existing order to free up limit",
        "Or try a smaller purchase amount that fits your current limit",
        "Your limit grows over time as you pay on time"
      ],
      timeToFix: "Immediate if you pay down an order",
      canWeHelp: true
    }
  },

  locked_virtual_card: {
    name: "Virtual Card Locked",
    currentMessage: "We are unable to process your transaction at this time because your VC has been locked. Please visit the Security page on your Sezzle Dashboard to unlock your card and retry.",
    category: "Security",
    actionable: true,
    aiResponse: {
      whyItHappened: "Your virtual card was locked for security reasons. This can happen if there was unusual activity or you locked it yourself.",
      steps: [
        "Open the Sezzle app or go to dashboard.sezzle.com",
        "Go to the Security page",
        "Unlock your virtual card",
        "Try your purchase again"
      ],
      timeToFix: "2 minutes",
      canWeHelp: true
    }
  },

  unavailable_in_your_state: {
    name: "Unavailable in Your State",
    currentMessage: "Sezzle is temporarily unavailable. Please check back at a later time.",
    category: "Location",
    actionable: false,
    aiResponse: {
      whyItHappened: "Sezzle is not currently available in your state due to local regulations.",
      steps: [
        "This is a regulatory restriction based on your location",
        "Unfortunately there's no workaround at this time",
        "Check back periodically — Sezzle is expanding to more states"
      ],
      timeToFix: "Not available at this time",
      canWeHelp: false
    }
  },

  merchant_lending_limit_over_time: {
    name: "Merchant Lending Limit",
    currentMessage: "Sezzle is temporarily unavailable. Please check back at a later time.",
    category: "Merchant",
    actionable: false,
    aiResponse: {
      whyItHappened: "This merchant has reached their temporary lending limit with Sezzle. This is not about your account — it's a merchant-level cap.",
      steps: [
        "This is temporary and usually resets within a few hours",
        "Try again later today or tomorrow",
        "Your account is fine — you can still shop at other stores"
      ],
      timeToFix: "Usually resets within hours",
      canWeHelp: false
    }
  },

  exceeds_new_customer_order_threshold: {
    name: "New Customer Limit",
    currentMessage: "In our commitment to financial empowerment and responsible spending, only one transaction is allowed within the first 24 hours of your first purchase. We are here to guide you on your journey by offering education and resources to support your financial well being; learn more on our blog.",
    category: "New Account",
    actionable: true,
    aiResponse: {
      whyItHappened: "As a new Sezzle customer, you can only make one purchase in your first 24 hours. This is a safety measure to protect your account.",
      steps: [
        "Wait 24 hours after your first purchase",
        "After that, you'll be able to shop normally",
        "In the meantime, explore stores in the Sezzle app"
      ],
      timeToFix: "24 hours from your first purchase",
      canWeHelp: false
    }
  },

  voip: {
    name: "VOIP Phone Detected",
    currentMessage: "We cannot approve your application at this time. Please contact support.",
    category: "Verification",
    actionable: true,
    aiResponse: {
      whyItHappened: "Sezzle detected that your phone number is a VOIP (internet-based) number. Sezzle requires a real mobile phone number for verification.",
      steps: [
        "Update your account with a real mobile phone number (not Google Voice, TextNow, etc.)",
        "Go to your Sezzle account settings to update your phone",
        "If you believe this is an error, contact Sezzle support"
      ],
      timeToFix: "5 minutes + support response time",
      canWeHelp: true
    }
  },

  other: {
    name: "General Decline",
    currentMessage: "We cannot approve your application at this time based on the information you have provided. Please verify all information was entered correctly upon account set up.",
    category: "General",
    actionable: true,
    aiResponse: {
      whyItHappened: "Your purchase couldn't be approved. This could be due to incorrect account information or other factors in our approval process.",
      steps: [
        "Double-check your name, address, and date of birth in the Sezzle app",
        "Make sure your linked payment method is valid and has funds",
        "If everything looks correct, contact Sezzle support for help"
      ],
      timeToFix: "5-10 minutes",
      canWeHelp: true
    }
  }
};

// ============================================================
// Lookup helper
// ============================================================

export function lookupDeclineCode(code) {
  if (declineCodes[code]) {
    return { code, ...declineCodes[code] };
  }

  // Unknown code — use the "other" fallback
  return { code, ...declineCodes["other"] };
}
