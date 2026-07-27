export interface Member {
  id: string;
  mutan_id: string;
  staff_id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  date_joined: string;
  membership_status: "active" | "suspended" | "dormant" | "exited";
  role: string;
  sms_opt_in: boolean;
  is_first_time?: boolean;
  onboarded_at?: string;
}

export interface Wallet {
  wallet_id: string;
  scheme_id: string;
  scheme_name: string;
  is_compulsory: boolean;
  balance: number;
  total_contributed: number;
  target_amount?: number;
  lock_until?: string;
  next_payout_date?: string;
  progress_percent?: string;
}

export interface Dashboard {
  greeting: string;
  mutan_id: string;
  membership_status: string;
  total_balance: number;
  available_for_cashout: number;
  wallets: Wallet[];
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  scheme_id?: string;
  scheme_name?: string;
  note?: string;
  month_label?: string;
  created_at: string;
}

export interface Scheme {
  id: string;
  name: string;
  description?: string;
  is_compulsory: boolean;
  is_active: boolean;
  waterfall_priority: number;
  monthly_target?: number;
  target_amount?: number;
  lock_until?: string;
  next_payout_date?: string;
  is_subscribed?: boolean;
  is_paused?: boolean;
  my_monthly_amount?: number;
  my_balance?: number;
  my_total_contributed?: number;
}

export interface Loan {
  id: string;
  principal_amount: number;
  outstanding_balance: number;
  monthly_repayment: number;
  amount_repaid: number;
  repayment_percent: string;
  status: "active" | "fully_paid" | "defaulted";
  due_date: string;
  purpose?: string;
}

export interface Subscription {
  id: string;
  scheme_id: string;
  scheme: Scheme;
  monthly_amount: number;
  is_active: boolean;
  is_paused: boolean;
  paused_reason?: string;
}

export interface InvestmentRound {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  amount_raised: number;
  fill_percent: string;
  profit_ratio?: number;
  open_date: string;
  maturity_date: string;
  status: string;
  eligibility: Record<string, any>;
  my_investment?: { amount: number; status: string } | null;
}

export interface ShareHolding {
  units_held: number;
  face_value_per_unit?: number;
  total_value: number;
  allow_new_purchases: boolean;
  last_dividend?: number;
  last_dividend_date?: string;
}

export interface ManualPayment {
  id: string;
  payment_type: string;
  declared_amount: number;
  verified_amount?: number;
  bank_reference: string;
  month_label?: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  created_at: string;
}

// types

export type PaymentType =
  | "subscription_payment"
  | "loan_repayment"
  | "wallet_topup";
