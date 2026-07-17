import { format, formatDistanceToNow } from 'date-fns'

export const formatCurrency = (n: number) =>
  `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const formatDate = (d: string | Date) =>
  format(new Date(d), 'dd MMM yyyy')

export const formatDateTime = (d: string | Date) =>
  format(new Date(d), 'dd MMM yyyy, hh:mm a')

export const formatRelative = (d: string | Date) =>
  formatDistanceToNow(new Date(d), { addSuffix: true })

export const txColor = (type: string) =>
  type.includes('debit') || type.includes('exit_debit') ? '#991b1b' : '#0F5132'

export const txSign = (type: string) =>
  type.includes('debit') || type.includes('exit_debit') ? '-' : '+'

// Maps each transaction type to a distinct icon name (resolved against the
// lucide-react icon map where this is used) so a levy deduction doesn't
// look identical to a waterfall credit at a glance — only the color used
// to differ.
export const txIconName = (type: string): string => {
  const map: Record<string, string> = {
    waterfall_credit: 'Repeat',
    manual_credit: 'Banknote',
    scheme_exit_credit: 'LogIn',
    scheme_exit_debit: 'LogOut',
    levy_debit: 'Receipt',
    dividend_credit: 'Gift',
    profit_share_credit: 'PieChart',
    credit: 'ArrowDownToLine',
    debit: 'ArrowUpFromLine',
  }
  return map[type] ?? 'TrendingUp'
}

// "Today" / "Yesterday" / "12 June 2026" — used to group a transaction
// list by day instead of one undifferentiated flat list.
export function dayGroupLabel(date: string | Date): string {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  if (isSameDay(d, today)) return 'Today'
  if (isSameDay(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'badge-green', approved: 'badge-green', fully_paid: 'badge-green',
    pending: 'badge-yellow', suspended: 'badge-gold',
    rejected: 'badge-red', defaulted: 'badge-red',
    exited: 'badge-gray', dormant: 'badge-gray', closed: 'badge-gray',
    open: 'badge-green', matured: 'badge-gold',
  }
  return map[status] ?? 'badge-gray'
}

export const paymentTypeLabel: Record<string, string> = {
  loan_repayment: 'Loan Repayment',
  wallet_topup: 'Wallet Top-up',
  subscription_payment: 'Subscription Payment',
}
