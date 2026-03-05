// ============================================================
// Mock User Data — for demo purposes only (NO real Sezzle data)
// ============================================================

export const mockUsers = {
  "sarah-chen-001": {
    userId: "sarah-chen-001",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    memberSince: "2023",
    sezzleScore: "Good",
    availableSpendingPower: 187.50,
    totalSpendingPower: 500.00,
    activeOrders: [
      {
        orderId: "SZ-29481",
        merchant: "Target",
        total: 249.99,
        perInstallment: 62.50,
        paidInstallments: 2,
        totalInstallments: 4,
        nextDueDate: "2026-03-12",
        status: "on_track"
      },
      {
        orderId: "SZ-30872",
        merchant: "Samsung",
        total: 425.00,
        perInstallment: 106.25,
        paidInstallments: 1,
        totalInstallments: 4,
        nextDueDate: "2026-03-08",
        status: "overdue",
        daysOverdue: 2
      },
      {
        orderId: "SZ-31203",
        merchant: "SHEIN",
        total: 54.99,
        perInstallment: 13.75,
        paidInstallments: 3,
        totalInstallments: 4,
        nextDueDate: "2026-03-20",
        status: "on_track"
      }
    ],
    overdueAmount: 106.25,
    rescheduledPayments: 0,
    failedPayments: 0,
    hasPurchaseRequest: true,
    isAnywhereMember: true,
    isPremiumMember: false,
    declineHistory: [
      {
        id: "dec-001",
        date: "2026-03-03T14:32:00Z",
        merchantName: "Best Buy",
        amount: 349.99,
        code: "insufficient_credit_limit",
        status: "unresolved"
      },
      {
        id: "dec-002",
        date: "2026-02-28T10:15:00Z",
        merchantName: "Amazon",
        amount: 89.99,
        code: "outstanding_failed_payments",
        status: "resolved",
        resolvedAction: "Paid overdue installment"
      },
      {
        id: "dec-003",
        date: "2026-02-15T16:45:00Z",
        merchantName: "Hiwingo Ltd",
        amount: 50.00,
        code: "1016",
        status: "resolved",
        resolvedAction: "Lowered purchase amount"
      },
      {
        id: "dec-004",
        date: "2026-01-22T09:20:00Z",
        merchantName: "Target",
        amount: 124.50,
        code: "purchase_request_not_present",
        status: "resolved",
        resolvedAction: "Created purchase request in app"
      },
      {
        id: "dec-005",
        date: "2026-01-15T13:10:00Z",
        merchantName: "PayPal",
        amount: 200.00,
        code: "merchant_match_is_exclude",
        status: "unresolvable",
        resolvedAction: "PayPal is permanently blocked"
      },
      {
        id: "dec-006",
        date: "2026-01-10T11:30:00Z",
        merchantName: "GameStop",
        amount: 69.99,
        code: "authorization_rate_limit_exceeded",
        status: "resolved",
        resolvedAction: "Waited 24 hours"
      }
    ]
  }
};

export function getUser(userId) {
  return mockUsers[userId] || mockUsers["sarah-chen-001"];
}
