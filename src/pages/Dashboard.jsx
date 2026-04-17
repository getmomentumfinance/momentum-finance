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
  rectSortingStrategy, useSortable, arrayMove,
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
import FadeIn from '../components/shared/FadeIn'
import GetStartedCard from '../components/dashboard/GetStartedCard'
import { useIsMobile } from '../hooks/useIsMobile'


const BALANCE_TYPES = ['debit', 'credit']
const CREDIT_TYPES  = new Set(['income'])

// ── Drag-and-drop widget order ─────────────────────────────────────
const DEFAULT_WIDGET_ORDER = [
  'recurring', 'pending',
  'planned',   'wishlist',
  'subscriptions', 'projection',
  'savings-goals', 'recent',
  'budgets',
]

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

  // ── Widget drag-and-drop order ─────────────────────────────────
  const [widgetOrder, setWidgetOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('dash-widget-order')
      if (saved) {
        const parsed = JSON.parse(saved)
        // merge: keep saved order, append any new keys that aren't in saved
        const merged = [...parsed, ...DEFAULT_WIDGET_ORDER.filter(k => !parsed.includes(k))]
        return merged
      }
    } catch { /* ignore */ }
    return DEFAULT_WIDGET_ORDER
  })
  const [activeWidgetId, setActiveWidgetId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart({ active }) { setActiveWidgetId(active.id) }
  function handleDragEnd({ active, over }) {
    setActiveWidgetId(null)
    if (!over || active.id === over.id) return
    setWidgetOrder(prev => {
      const next = arrayMove(prev, prev.indexOf(active.id), prev.indexOf(over.id))
      localStorage.setItem('dash-widget-order', JSON.stringify(next))
      return next
    })
  }
  function handleDragCancel() { setActiveWidgetId(null) }

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
                    <button
                      type="button"
                      onClick={() => {
                        setWidgetOrder(DEFAULT_WIDGET_ORDER)
                        localStorage.removeItem('dash-widget-order')
                      }}
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

        {/* Bottom: drag-and-drop widget grid */}
        {(() => {
          const WIDGET_MAP = {
            'recurring':     { visKey: 'dash-showRecurring',      node: <RecurringBills currentDate={currentDate} /> },
            'planned':       { visKey: 'dash-showPlanned',        node: <PlannedBills currentDate={currentDate} /> },
            'subscriptions': { visKey: 'dash-showSubscriptions',  node: <Subscriptions currentDate={currentDate} /> },
            'savings-goals': { visKey: 'dash-showSavingsGoals',   node: <SavingsGoals /> },
            'budgets':       { visKey: 'dash-showBudgets',        node: <BudgetsWidget currentDate={currentDate} /> },
            'pending':       { visKey: 'dash-showPending',        node: <PendingTransactions currentDate={currentDate} /> },
            'wishlist':      { visKey: 'dash-showWishlist',       node: <Wishlist currentDate={currentDate} /> },
            'projection':    { visKey: 'dash-showProjection',     node: <BalanceProjection currentDate={currentDate} /> },
            'recent':        { visKey: 'dash-showRecent',         node: <RecentTransactions currentDate={currentDate} /> },
          }
          const visibleIds = widgetOrder.filter(id => WIDGET_MAP[id] && v(WIDGET_MAP[id].visKey))

          return (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={visibleIds} strategy={rectSortingStrategy}>
                <div className={`grid gap-4 mt-4 items-start ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {visibleIds.map((id, i) => (
                    <SortableWidget key={id} id={id}>
                      <FadeIn delay={i * 40}>
                        {WIDGET_MAP[id].node}
                      </FadeIn>
                    </SortableWidget>
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeWidgetId && (
                  <div className="rounded-2xl border w-full h-24 backdrop-blur-sm"
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
