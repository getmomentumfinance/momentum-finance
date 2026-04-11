import { useState, useEffect, useRef } from 'react'
import { Plus, Download, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTransactionModal } from '../context/TransactionModalContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/dashboard/Navbar'
import { Wallet, TrendingDown, PiggyBank, TrendingUp, Banknote, LineChart } from 'lucide-react'
import { usePortfolioValue } from '../hooks/usePortfolioValue'
import { usePreferences } from '../context/UserPreferencesContext'
import CalendarWidget from '../components/dashboard/CalendarWidget'
import { StatCard } from '../components/dashboard/SummaryCards'
import StatCardActivityModal from '../components/dashboard/StatCardActivityModal'
import AccountsList from '../components/dashboard/AccountsList'
import RecurringBills from '../components/dashboard/RecurringBills'
import PlannedBills from '../components/dashboard/PlannedBills'
import Subscriptions from '../components/dashboard/Subscriptions'
import SavingsGoals from '../components/dashboard/SavingsGoals'
import PendingTransactions from '../components/dashboard/PendingTransactions'
import Wishlist from '../components/dashboard/Wishlist'
import BalanceProjection from '../components/dashboard/BalanceProjection'
import StillToPayCard from '../components/dashboard/StillToPayCard'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import BudgetsWidget from '../components/dashboard/BudgetsWidget'
import TargetsWidget from '../components/dashboard/TargetsWidget'
import ActionCenter from '../components/dashboard/ActionCenter'
import FinancialInsights from '../components/dashboard/FinancialInsights'
import FadeIn from '../components/shared/FadeIn'
import GetStartedCard from '../components/dashboard/GetStartedCard'


const BALANCE_TYPES = ['debit', 'credit']
const CREDIT_TYPES  = new Set(['income'])

export default function Dashboard() {
  const { user } = useAuth()
  const { openTransactionModal } = useTransactionModal()
  const [currentDate,       setCurrentDate]       = useState(new Date())
  const [totalBalance,      setTotalBalance]      = useState(0)
  const [cashBalance,       setCashBalance]       = useState(0)
  const [totalIncome,       setTotalIncome]       = useState(0)
  const [totalExpenses,     setTotalExpenses]     = useState(0)
  const portfolioValue      = usePortfolioValue(user)
  const { t }               = usePreferences()
  const [totalSavingsMonth, setTotalSavingsMonth] = useState(0)
  const [totalSavings,      setTotalSavings]      = useState(0)
  const [activityKind,      setActivityKind]      = useState(null)

  // ── Card visibility ───────────────────────────────────────────
  const DASH_CARDS = [
    { key: 'dash-showFinancialInsights', label: 'Financial Insights' },
    { key: 'dash-showActionCenter',      label: 'Action Center'      },
    { key: 'dash-showRecurring',         label: 'Recurring Bills'    },
    { key: 'dash-showPlanned',           label: 'Planned Bills'      },
    { key: 'dash-showSubscriptions',     label: 'Subscriptions'      },
    { key: 'dash-showSavingsGoals',      label: 'Savings Goals'      },
    { key: 'dash-showBudgets',           label: 'Budgets'            },
    { key: 'dash-showTargets',           label: 'Targets'            },
    { key: 'dash-showPending',           label: 'Pending Transactions'},
    { key: 'dash-showWishlist',          label: 'Wishlist'           },
    { key: 'dash-showProjection',        label: 'Balance Projection' },
    { key: 'dash-showRecent',            label: 'Recent Transactions'},
  ]
  const [cardVis, setCardVis] = useState(() =>
    Object.fromEntries(DASH_CARDS.map(c => [c.key, (localStorage.getItem(c.key) ?? 'true') === 'true']))
  )
  const [visOpen, setVisOpen] = useState(false)
  const visRef = useRef(null)
  useEffect(() => {
    if (!visOpen) return
    function handler(e) { if (visRef.current && !visRef.current.contains(e.target)) setVisOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [visOpen])
  function toggleCard(key, val) {
    setCardVis(prev => ({ ...prev, [key]: val }))
    localStorage.setItem(key, String(val))
  }
  const v = key => cardVis[key] ?? true

  useEffect(() => {
    if (!user?.id) return
    async function load() {
      const year  = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const start = new Date(year, month, 1).toISOString().slice(0, 10)
      const end   = new Date(year, month + 1, 0).toISOString().slice(0, 10)

      const [{ data: balanceCards }, { data: cashCards }, { data: savingsCards }, { data: allTxs }, { data: monthTxs }] = await Promise.all([
        supabase.from('cards').select('id, initial_balance').eq('user_id', user.id).in('type', BALANCE_TYPES),
        supabase.from('cards').select('id, initial_balance').eq('user_id', user.id).eq('type', 'cash'),
        supabase.from('cards').select('initial_balance').eq('user_id', user.id).eq('type', 'savings'),
        supabase.from('transactions').select('card_id, type, amount, is_cash, source, split_parent_id').eq('user_id', user.id).eq('is_deleted', false),
        supabase.from('transactions').select('type, amount, source, is_split_parent').eq('user_id', user.id).eq('is_deleted', false).gte('date', start).lte('date', end),
      ])

      if (allTxs) {
        const cardTotal = (balanceCards ?? []).reduce((sum, card) => {
          const delta = allTxs
            .filter(t => t.card_id === card.id && !t.is_cash && !t.split_parent_id)
            .reduce((s, t) => s + (CREDIT_TYPES.has(t.type) ? t.amount : -t.amount), 0)
          return sum + Number(card.initial_balance) + delta
        }, 0)
        const cashInitial = (cashCards ?? []).reduce((s, c) => s + Number(c.initial_balance), 0)
        const cashTxTotal = allTxs
          .filter(t => t.is_cash)
          .reduce((s, t) => s + (CREDIT_TYPES.has(t.type) ? t.amount : -t.amount), 0)
        const cashTotal = cashInitial + cashTxTotal
        setCashBalance(cashTotal)
        setTotalBalance(cardTotal + cashTotal)

        const savingsInitial = (savingsCards ?? []).reduce((s, c) => s + Number(c.initial_balance), 0)
        const savIn  = allTxs.filter(t => t.source === 'savings_in'  && t.amount > 0).reduce((s, t) => s + t.amount, 0)
        const savOut = allTxs.filter(t => t.source === 'savings_out' && t.amount > 0).reduce((s, t) => s + t.amount, 0)
        setTotalSavings(savingsInitial + savIn - savOut)
      }

      if (monthTxs) {
        setTotalIncome(      monthTxs.filter(t => t.type === 'income'  && !t.is_split_parent).reduce((s, t) => s + t.amount, 0))
        setTotalExpenses(    monthTxs.filter(t => t.type === 'expense' && !t.is_split_parent).reduce((s, t) => s + t.amount, 0))
        const savMonthIn  = monthTxs.filter(t => t.source === 'savings_in'  && t.amount > 0).reduce((s, t) => s + t.amount, 0)
        const savMonthOut = monthTxs.filter(t => t.source === 'savings_out' && t.amount > 0).reduce((s, t) => s + t.amount, 0)
        setTotalSavingsMonth(savMonthIn - savMonthOut)
      }
    }
    load()
    window.addEventListener('transaction-saved', load)
    return () => window.removeEventListener('transaction-saved', load)
  }, [user?.id, currentDate])


  const dateStr    = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long' })

  function prevMonth() { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)) }
  function nextMonth() { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)) }

  return (
    <div className="min-h-screen bg-dash-bg text-white">
      <Navbar currentDate={currentDate} onPrev={prevMonth} onNext={nextMonth} />

      <div id="page-content" className="py-6 px-16">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t('dash.overview', { month: monthLabel })}</h1>
            <p className="text-muted text-sm mt-1">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openTransactionModal} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
              <Plus size={15} /> {t('dash.addTransaction')}
            </button>
            <button className="bg-dash-card border border-border flex items-center gap-2 px-4 py-2 rounded-xl text-sm hover:border-accent transition-colors">
              <Download size={14} /> {t('dash.exportView')}
            </button>
            <div className="relative" ref={visRef}>
              <button
                type="button"
                onClick={() => setVisOpen(v => !v)}
                className={`p-2 rounded-xl border transition-colors ${visOpen ? 'bg-white/10 border-white/20 text-white' : 'bg-dash-card border-border text-white/40 hover:text-white/70 hover:border-white/20'}`}
              >
                <SlidersHorizontal size={14} />
              </button>
              {visOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 glass-popup border border-white/10 rounded-2xl p-4 w-56 shadow-xl flex flex-col gap-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted font-medium">Visible cards</p>
                  {DASH_CARDS.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-white/60">{label}</span>
                      <button
                        type="button"
                        onClick={() => toggleCard(key, !cardVis[key])}
                        className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${cardVis[key] ? '' : 'bg-white/10'}`}
                        style={cardVis[key] ? { background: 'var(--color-accent)' } : undefined}
                      >
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${cardVis[key] ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>


        <GetStartedCard />

        {/* Top section */}
        <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>

          {/* Calendar */}
          <div style={{ gridColumn: '1 / span 2' }} className="h-full">
            <CalendarWidget
              currentDate={currentDate}
              onDayClick={day => {
                const y = currentDate.getFullYear()
                const m = String(currentDate.getMonth() + 1).padStart(2, '0')
                const d = String(day).padStart(2, '0')
                openTransactionModal({ date: `${y}-${m}-${d}` })
              }}
            />
          </div>

          {/* Col 3: Total Balance, Income, Cash */}
          <div className="flex flex-col gap-3">
            <div className="flex-1"><StatCard label={t('dash.totalBalance')} icon={Wallet}     value={totalBalance}  onCardClick={() => setActivityKind('balance')} /></div>
            <div className="flex-1"><StatCard label={t('dash.income')}        icon={TrendingUp} value={totalIncome}   onCardClick={() => setActivityKind('income')} /></div>
            <div className="flex-1"><StatCard label={t('dash.cash')}          icon={Banknote}   value={cashBalance}   onCardClick={() => setActivityKind('cash')} /></div>
          </div>

          {/* Cols 4-5: 2×2 stat cards + Still to Pay */}
          <div style={{ gridColumn: '4 / span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <StatCard label={t('dash.expenses')}      icon={TrendingDown} value={totalExpenses}    onCardClick={() => setActivityKind('expenses')} />
            <StatCard label={t('dash.investments')}   icon={LineChart}    value={portfolioValue ?? 0} onCardClick={() => setActivityKind('investments')} />
            <StatCard label={t('dash.savingsMonth')}  icon={PiggyBank}    value={totalSavingsMonth} onCardClick={() => setActivityKind('savings-month')} />
            <StatCard label={t('dash.totalSavings')}  icon={PiggyBank}    value={totalSavings}      onCardClick={() => setActivityKind('total-savings')} />
            <div style={{ gridColumn: 'span 2' }}>
              <StillToPayCard currentDate={currentDate} />
            </div>
          </div>

          {/* Col 6: AccountsList */}
          <AccountsList currentDate={currentDate} />

        </div>

        {/* Financial Insights + Action Center side by side */}
        {(v('dash-showFinancialInsights') || v('dash-showActionCenter')) && (
        <FadeIn delay={100}>
        <div className="flex gap-4 items-stretch mb-4" style={{ height: '230px' }}>
          {v('dash-showFinancialInsights') && (
            <div className="flex-1 min-w-0 h-full">
              <FinancialInsights currentDate={currentDate} />
            </div>
          )}
          {v('dash-showActionCenter') && (
            <div className="shrink-0 h-full" style={{ width: '300px' }}>
              <ActionCenter currentDate={currentDate} />
            </div>
          )}
        </div>
        </FadeIn>
        )}

        {/* Bottom: fixed 2 columns */}
        <div className="grid grid-cols-2 gap-4 mt-4 items-start">
          <div className="flex flex-col gap-4">
            {v('dash-showRecurring')     && <FadeIn delay={0}><RecurringBills currentDate={currentDate} /></FadeIn>}
            {v('dash-showPlanned')       && <FadeIn delay={50}><PlannedBills currentDate={currentDate} /></FadeIn>}
            {v('dash-showSubscriptions') && <FadeIn delay={100}><Subscriptions currentDate={currentDate} /></FadeIn>}
            {v('dash-showSavingsGoals')  && <FadeIn delay={150}><SavingsGoals /></FadeIn>}
            {v('dash-showBudgets')       && <FadeIn delay={200}><BudgetsWidget currentDate={currentDate} /></FadeIn>}
            {v('dash-showTargets')       && <FadeIn delay={250}><TargetsWidget currentDate={currentDate} /></FadeIn>}
          </div>
          <div className="flex flex-col gap-4">
            {v('dash-showPending')    && <FadeIn delay={50}><PendingTransactions currentDate={currentDate} /></FadeIn>}
            {v('dash-showWishlist')   && <FadeIn delay={100}><Wishlist currentDate={currentDate} /></FadeIn>}
            {v('dash-showProjection') && <FadeIn delay={150}><BalanceProjection currentDate={currentDate} /></FadeIn>}
            {v('dash-showRecent')     && <FadeIn delay={200}><RecentTransactions currentDate={currentDate} /></FadeIn>}
          </div>
        </div>
      </div>

      {activityKind && (
        <StatCardActivityModal
          kind={activityKind}
          currentDate={currentDate}
          onClose={() => setActivityKind(null)}
        />
      )}
    </div>
  )
}
