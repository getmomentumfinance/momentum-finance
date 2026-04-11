import { TrendingUp, TrendingDown, ArrowLeftRight, PiggyBank, LineChart, Banknote } from 'lucide-react'

export const TRANSACTION_TYPES = [
  { value: 'income',   label: 'Income',   Icon: TrendingUp,     color: 'var(--type-income)'   },
  { value: 'expense',  label: 'Expense',  Icon: TrendingDown,   color: 'var(--type-expense)'  },
  { value: 'transfer', label: 'Transfer', Icon: ArrowLeftRight, color: 'var(--type-transfer)' },
  { value: 'savings',  label: 'Savings',  Icon: PiggyBank,      color: 'var(--type-savings)'  },
  { value: 'invest',   label: 'Invest',   Icon: LineChart,      color: 'var(--type-invest)'   },
  { value: 'cash_out', label: 'Cash Out', Icon: Banknote,       color: 'var(--type-cash-out)' },
]

export const TYPES_MAP = Object.fromEntries(TRANSACTION_TYPES.map(t => [t.value, t]))

// CSS variable name for a given type value
export function typeCssVar(value) {
  return `--type-${value.replace('_', '-')}`
}
