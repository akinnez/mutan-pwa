import api from './client'

export const memberApi = {
  getProfile: () => api.get('/members/me'),
  updateProfile: (d: { email?: string; sms_opt_in?: boolean }) =>
    api.patch('/members/me', d),
  getDashboard: () => api.get('/members/me/dashboard'),
  getTransactions: (params?: { page?: number; limit?: number; scheme_id?: string }) =>
    api.get('/members/me/transactions', { params }),
  getSubscriptions: () => api.get('/members/me/subscriptions'),
  updateSubscription: (schemeId: string, d: { monthly_amount?: number; is_paused?: boolean; paused_reason?: string }) =>
    api.patch(`/members/me/subscriptions/${schemeId}`, d),
  getLoans: () => api.get('/members/me/loans'),
  getActiveLoan: () => api.get('/loans/me/active'),
  // Arrears-aware loan status — drives the overdue popup on dashboard load.
  // Uses the exact same rollover formula as the waterfall, so the figure
  // shown here always matches what the next payment will actually collect.
  getLoanStatus: () => api.get('/members/me/loans/status'),
  getPayments: () => api.get('/members/me/payments'),
  declarePayment: (formData: FormData) =>
    api.post('/members/me/payments/declare', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  joinScheme: (schemeId: string, monthly_amount: number) =>
    api.post(`/members/me/schemes/${schemeId}/join`, { monthly_amount }),
  exitScheme: (schemeId: string) =>
    api.delete(`/members/me/schemes/${schemeId}/exit`),
  getSchemes: () => api.get('/schemes'),

  // ── Pay Direct (Paystack) ──────────────────────────────────────────────
  initializePaystack: (d: {
    payment_type: 'subscription_payment' | 'loan_repayment' | 'wallet_topup'
    amount: number
    is_directed?: boolean
    target_loan_id?: string
    target_scheme_id?: string
    month_label?: string
  }) => api.post('/paystack/initialize', d),
  verifyPaystack: (reference: string) => api.get(`/paystack/verify/${reference}`),
  getPaystackTransactions: () => api.get('/paystack/my-transactions'),
}
