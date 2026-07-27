const KEY = "mutan_pending_payment";

export interface PendingPayment {
  reference: string;
  amount: number;
  payment_type: string;
}

export const PaymentSession = {
  save(payment: PendingPayment) {
    sessionStorage.setItem(KEY, JSON.stringify(payment));
  },

  get(): PendingPayment | null {
    const value = sessionStorage.getItem(KEY);

    return value ? JSON.parse(value) : null;
  },

  clear() {
    sessionStorage.removeItem(KEY);
  },
};