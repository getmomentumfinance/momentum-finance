import { useState, useEffect, useRef } from 'react'
import { Plus, Download, SlidersHorizontal, GripHorizontal, RotateCcw } from 'lucide-react'
import {
  DndContext, DragOverlay,
  closestCenter,
  KeyboardSensor, PointerSensor,
  useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
import ActionCenter from '../components/dashboard/ActionCenter'
import FinancialInsights from '../components/dashboard/FinancialInsights'
import MyCardsWidget from '../components/dashboard/MyCardsWidget'
import FadeIn from '../components/shared/FadeIn'
import GetStartedCard from '../components/dashboard/GetStartedCard'
import { useIsMobile } from '../hooks/useIsMobile'
import { useUIPrefs } from '../context/UIPrefContext'


const BALANCE_TYPES = ['debit', 'credit']
const CREDIT_TYPES  = new Set(['income'])

// ── Drag-and-drop widget columns ───────────────────────────────────
const DEFAULT_LEFT_COL  = ['my-cards', 'recurring', 'planned', 'subscriptions', 'savings-goals', 'budgets']
const DEFAULT_RIGHT_COL = ['pending', 'wishlist', 'projection', 'recent']

function SortableWidget({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
      className="relative group"
    >
      {/* Drag handle — center-top, clear of card action buttons */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-40 hover:!opacity-80 cursor-grab active:cursor-grabbing touch-none transition-opacity p-1 rounded"
        style={{ color: 'var(--color-muted)' }}
      >
        <GripHorizontal size={15} />
      </div>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { openTransactionModal } = useTransactionModal()
  const { setPref, deletePrefs, loaded: prefsLoaded } = useUIPrefs()
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
  const isMobile = useIsMobile()

  // ── Widget drag-and-drop columns ───────────────────────────────
  // Initialize both columns together to prevent a key appearing in both
  const [{ leftCol, rightCol }, setColumns] = useState(() => {
    try {
      const ls = localStorage.getItem('dash-left-col')
      const rs = localStorage.getItem('dash-right-col')
      if (ls || rs) {
        let left  = ls ? JSON.parse(ls) : DEFAULT_LEFT_COL
        let right = rs ? JSON.parse(rs) : DEFAULT_RIGHT_COL
        // If a key somehow ended up in both, right column wins
        const rightSet = new Set(right)
        left = left.filter(k => !rightSet.has(k))
        // Append any new default keys not present in either column
        const allIds = new Set([...left, ...right])
        left  = [...left,  ...DEFAULT_LEFT_COL.filter(k  => !allIds.has(k))]
        right = [...right, ...DEFAULT_RIGHT_COL.filter(k => !allIds.has(k))]
        return { leftCol: left, rightCol: right }
      }
    } catch { /* ignore */ }
    return { leftCol: DEFAULT_LEFT_COL, rightCol: DEFAULT_RIGHT_COL }
  })

  function setLeftCol(next)  { setColumns(prev => ({ ...prev, leftCol:  typeof next === 'function' ? next(prev.leftCol)  : next })) }
  function setRightCol(next) { setColumns(prev => ({ ...prev, rightCol: typeof next === 'function' ? next(prev.rightCol) : next })) }
  const [activeWidgetId, setActiveWidgetId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart({ active }) { setActiveWidgetId(active.id) }
  function handleDragEnd({ active, over }) {
    setActiveWidgetId(null)
    if (!over || active.id === over.id) return

    const srcLeft = leftCol.includes(active.id)
    const dstLeft = leftCol.includes(over.id)

    if (srcLeft && dstLeft) {
      // reorder within left column
      const next = arrayMove(leftCol, leftCol.indexOf(active.id), leftCol.indexOf(over.id))
      setLeftCol(next)
      setPref('dash-left-col', JSON.stringify(next))
    } else if (!srcLeft && !dstLeft) {
      // reorder within right column
      const next = arrayMove(rightCol, rightCol.indexOf(active.id), rightCol.indexOf(over.id))
      setRightCol(next)
      setPref('dash-right-col', JSON.stringify(next))
    } else if (srcLeft && !dstLeft) {
      // left → right: remove from left, insert before the over item in right
      const newLeft  = leftCol.filter(id => id !== active.id)
      const overIdx  = rightCol.indexOf(over.id)
      const newRight = [...rightCol.slice(0, overIdx), active.id, ...rightCol.slice(overIdx)]
      setLeftCol(newLeft);   setPref('dash-left-col',  JSON.stringify(newLeft))
      setRightCol(newRight); setPref('dash-right-col', JSON.stringify(newRight))
    } else {
      // right → left: remove from right, insert before the over item in left
      const newRight = rightCol.filter(id => id !== active.id)
      const overIdx  = leftCol.indexOf(over.id)
      const newLeft  = [...leftCol.slice(0, overIdx), active.id, ...leftCol.slice(overIdx)]
      setRightCol(newRight); setPref('dash-right-col', JSON.stringify(newRight))
      setLeftCol(newLeft);   setPref('dash-left-col',  JSON.stringify(newLeft))
    }
  }
  function handleDragCancel() { setActiveWidgetId(null) }

  function resetWidgetOrder() {
    setLeftCol(DEFAULT_LEFT_COL)
    setRightCol(DEFAULT_RIGHT_COL)
    deletePrefs(['dash-left-col', 'dash-right-col'])
  }

  // ── Hide-paid toggles ─────────────────────────────────────────
  const HIDE_PAID_CARDS = [
    { key: 'bills-hide-paid',   label: 'Recurring Bills' },
    { key: 'planned-hide-paid', label: 'Planned Bills'   },
    { key: 'subs-hide-paid',    label: 'Subscriptions'   },
    { key: 'pending-hide-paid', label: 'Pending'         },
  ]
  const [hidePaidMap, setHidePaidMap] = useState(() =>
    Object.fromEntries(HIDE_PAID_CARDS.map(c => [c.key, localStorage.getItem(c.key) === 'true']))
  )
  function toggleHidePaid(key) {
    setHidePaidMap(prev => {
      const next = { ...prev, [key]: !prev[key] }
      setPref(key, String(next[key]))
      return next
    })
  }

  // ── Card visibility ───────────────────────────────────────────
  const DASH_CARDS = [
    { key: 'dash-showMyCards',           label: 'My Cards'           },
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
    setPref(key, String(val))
  }
  const v = key => cardVis[key] ?? true

  // Re-initialize all display prefs once Supabase values have been seeded into localStorage
  useEffect(() => {
    if (!prefsLoaded) return
    const ls = localStorage.getItem('dash-left-col')
    const rs = localStorage.getItem('dash-right-col')
    if (ls || rs) {
      try {
        let left  = ls ? JSON.parse(ls) : DEFAULT_LEFT_COL
        let right = rs ? JSON.parse(rs) : DEFAULT_RIGHT_COL
        const rightSet = new Set(right)
        left = left.filter(k => !rightSet.has(k))
        const allIds = new Set([...left, ...right])
        left  = [...left,  ...DEFAULT_LEFT_COL.filter(k  => !allIds.has(k))]
        right = [...right, ...DEFAULT_RIGHT_COL.filter(k => !allIds.has(k))]
        setColumns({ leftCol: left, rightCol: right })
      } catch {}
    }
    setHidePaidMap(Object.fromEntries(HIDE_PAID_CARDS.map(c => [c.key, localStorage.getItem(c.key) === 'true'])))
    setCardVis(Object.fromEntries(DASH_CARDS.map(c => [c.key, (localStorage.getItem(c.key) ?? 'true') === 'true'])))
  }, [prefsLoaded])

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

      <div id="page-content" className="py-6 px-4 md:px-16 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold truncate">{t('dash.overview', { month: monthLabel })}</h1>
            <p className="text-muted text-xs md:text-sm mt-0.5 hidden sm:block">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button onClick={openTransactionModal} className="btn-primary flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium">
              <Plus size={15} /> <span className="hidden sm:inline">{t('dash.addTransaction')}</span>
            </button>
            <button className="hidden sm:flex bg-dash-card border border-border items-center gap-2 px-4 py-2 rounded-xl text-sm hover:border-accent transition-colors">
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
                  <div className="border-t border-white/8 pt-3 mt-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted font-medium mb-2">Hide paid</p>
                    {HIDE_PAID_CARDS.map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-xs text-white/60">{label}</span>
                        <button
                          type="button"
                          onClick={() => toggleHidePaid(key)}
                          className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${hidePaidMap[key] ? '' : 'bg-white/10'}`}
                          style={hidePaidMap[key] ? { background: 'var(--color-accent)' } : undefined}
                        >
                          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${hidePaidMap[key] ? 'left-4' : 'left-0.5'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/8 pt-3">
                    <button
                      type="button"
                      onClick={resetWidgetOrder}
                      className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors w-full"
                    >
                      <RotateCcw size={12} /> Reset card order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        <GetStartedCard />

        {/* Top section — desktop: 6-col grid | mobile: stacked */}
        {!isMobile && <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>

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

        </div>}

        {/* Mobile top section — stat cards in 2-col grid, then accounts */}
        {isMobile && <div className="flex flex-col gap-3 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t('dash.totalBalance')} icon={Wallet}      value={totalBalance}      onCardClick={() => setActivityKind('balance')} />
            <StatCard label={t('dash.income')}        icon={TrendingUp}  value={totalIncome}        onCardClick={() => setActivityKind('income')} />
            <StatCard label={t('dash.expenses')}      icon={TrendingDown} value={totalExpenses}     onCardClick={() => setActivityKind('expenses')} />
            <StatCard label={t('dash.cash')}          icon={Banknote}    value={cashBalance}        onCardClick={() => setActivityKind('cash')} />
            <StatCard label={t('dash.savingsMonth')}  icon={PiggyBank}   value={totalSavingsMonth}  onCardClick={() => setActivityKind('savings-month')} />
            <StatCard label={t('dash.totalSavings')}  icon={PiggyBank}   value={totalSavings}       onCardClick={() => setActivityKind('total-savings')} />
          </div>
          <StillToPayCard currentDate={currentDate} />
          <AccountsList currentDate={currentDate} />
          <CalendarWidget
            currentDate={currentDate}
            onDayClick={day => {
              const y = currentDate.getFullYear()
              const m = String(currentDate.getMonth() + 1).padStart(2, '0')
              const d = String(day).padStart(2, '0')
              openTransactionModal({ date: `${y}-${m}-${d}` })
            }}
          />
        </div>}

        {/* Financial Insights + Action Center */}
        {(v('dash-showFinancialInsights') || v('dash-showActionCenter')) && (
        <FadeIn delay={100}>
        {!isMobile && (
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
        )}
        {isMobile && (
          <div className="flex flex-col gap-3 mb-4">
            {v('dash-showFinancialInsights') && <FinancialInsights currentDate={currentDate} />}
            {v('dash-showActionCenter') && <ActionCenter currentDate={currentDate} />}
          </div>
        )}
        </FadeIn>
        )}

        {/* Bottom: two independent sortable columns — no gaps on drag */}
        {(() => {
          const WIDGET_MAP = {
            'my-cards':      { visKey: 'dash-showMyCards',       node: <MyCardsWidget currentDate={currentDate} /> },
            'recurring':     { visKey: 'dash-showRecurring',     node: <RecurringBills currentDate={currentDate} hidePaid={hidePaidMap['bills-hide-paid']} /> },
            'planned':       { visKey: 'dash-showPlanned',       node: <PlannedBills currentDate={currentDate} hidePaid={hidePaidMap['planned-hide-paid']} /> },
            'subscriptions': { visKey: 'dash-showSubscriptions', node: <Subscriptions currentDate={currentDate} hidePaid={hidePaidMap['subs-hide-paid']} /> },
            'savings-goals': { visKey: 'dash-showSavingsGoals',  node: <SavingsGoals /> },
            'budgets':       { visKey: 'dash-showBudgets',       node: <BudgetsWidget currentDate={currentDate} /> },
            'pending':       { visKey: 'dash-showPending',       node: <PendingTransactions currentDate={currentDate} hidePaid={hidePaidMap['pending-hide-paid']} /> },
            'wishlist':      { visKey: 'dash-showWishlist',      node: <Wishlist currentDate={currentDate} /> },
            'projection':    { visKey: 'dash-showProjection',    node: <BalanceProjection currentDate={currentDate} /> },
            'recent':        { visKey: 'dash-showRecent',        node: <RecentTransactions currentDate={currentDate} /> },
          }
          const visLeft  = leftCol.filter(id  => WIDGET_MAP[id]  && v(WIDGET_MAP[id].visKey))
          const visRight = rightCol.filter(id => WIDGET_MAP[id] && v(WIDGET_MAP[id].visKey))
          // On mobile flatten both columns into one sortable list
          const visMobile = [...leftCol, ...rightCol].filter(id => WIDGET_MAP[id] && v(WIDGET_MAP[id].visKey))

          return (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              {isMobile ? (
                <SortableContext items={visMobile} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-4 mt-4">
                    {visMobile.map((id, i) => (
                      <SortableWidget key={id} id={id}>
                        <FadeIn delay={i * 40}>{WIDGET_MAP[id].node}</FadeIn>
                      </SortableWidget>
                    ))}
                  </div>
                </SortableContext>
              ) : (
                <div className="flex gap-4 mt-4 items-start">
                  {/* Left column */}
                  <div className="flex-1 flex flex-col gap-4 min-w-0">
                    <SortableContext items={visLeft} strategy={verticalListSortingStrategy}>
                      {visLeft.map((id, i) => (
                        <SortableWidget key={id} id={id}>
                          <FadeIn delay={i * 40}>{WIDGET_MAP[id].node}</FadeIn>
                        </SortableWidget>
                      ))}
                    </SortableContext>
                  </div>
                  {/* Right column */}
                  <div className="flex-1 flex flex-col gap-4 min-w-0">
                    <SortableContext items={visRight} strategy={verticalListSortingStrategy}>
                      {visRight.map((id, i) => (
                        <SortableWidget key={id} id={id}>
                          <FadeIn delay={i * 40}>{WIDGET_MAP[id].node}</FadeIn>
                        </SortableWidget>
                      ))}
                    </SortableContext>
                  </div>
                </div>
              )}
              <DragOverlay>
                {activeWidgetId && (
                  <div className="rounded-2xl w-full h-20 backdrop-blur-sm"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', opacity: 0.7 }} />
                )}
              </DragOverlay>
            </DndContext>
          )
        })()}
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
