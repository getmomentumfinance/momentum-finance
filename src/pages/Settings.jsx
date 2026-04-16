import { useState, useRef, useEffect } from 'react'
import { User, Palette, BookOpen, CreditCard, Database, Camera, LogOut, Mail, KeyRound, Globe, Calendar, DollarSign, Home, Layers, TrendingUp, Wallet, HelpCircle, ChevronRight, LayoutDashboard, BarChart2, PiggyBank, Target, Receipt, LineChart, CalendarDays, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/UserPreferencesContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTransactionModal } from '../context/TransactionModalContext'
import Navbar from '../components/dashboard/Navbar'
import CategoriesTab from '../components/settings/CategoriesTab'
import AppearanceTab from '../components/settings/AppearanceTab'
import CardsTab from '../components/settings/CardsTab'
import FinancialSituationTab from '../components/settings/FinancialSituationTab'

const CURRENCIES = [
  { value: 'EUR', label: '€ Euro' },
  { value: 'USD', label: '$ US Dollar' },
  { value: 'GBP', label: '£ British Pound' },
  { value: 'CHF', label: 'CHF Swiss Franc' },
  { value: 'JPY', label: '¥ Japanese Yen' },
  { value: 'CAD', label: 'CA$ Canadian Dollar' },
  { value: 'AUD', label: 'A$ Australian Dollar' },
  { value: 'SEK', label: 'kr Swedish Krona' },
  { value: 'NOK', label: 'kr Norwegian Krone' },
  { value: 'DKK', label: 'kr Danish Krone' },
]

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
]

const LANDING_PAGES = [
  { value: '/dashboard',    label: 'Home' },
  { value: '/analytics',    label: 'Analytics' },
  { value: '/savings',      label: 'Savings' },
  { value: '/budgets',      label: 'Budgets' },
  { value: '/transactions', label: 'Transactions' },
  { value: '/portfolio',    label: 'Portfolio' },
  { value: '/summary',      label: 'Summary' },
]

function SelectRow({ icon: Icon, label, value, onChange, options }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Icon size={14} />
        {label}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-sm text-white/70 outline-none focus:border-white/15 focus:text-white transition-colors cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

const TAB_IDS = [
  { id: 'account',    labelKey: 'set.account',    icon: User },
  { id: 'appearance', labelKey: 'set.appearance', icon: Palette },
  { id: 'categories', labelKey: 'set.library',    icon: BookOpen },
  { id: 'cards',      labelKey: 'set.cards',      icon: CreditCard },
  { id: 'financial',  labelKey: 'set.financial',  icon: TrendingUp },
  { id: 'data',       labelKey: 'set.data',       icon: Database },
  { id: 'help',       labelKey: 'set.help',       icon: HelpCircle },
]

// ── Account tab ────────────────────────────────────────────────
function AccountTab() {
  const { user } = useAuth()
  const { fmt, t } = usePreferences()
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name ?? '')
  const [avatarUrl,   setAvatarUrl]   = useState(user?.user_metadata?.avatar_url ?? null)
  const [uploading,   setUploading]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [resetSent,   setResetSent]   = useState(false)
  const [currency,    setCurrency]    = useState(user?.user_metadata?.currency     ?? 'EUR')
  const [dateFormat,  setDateFormat]  = useState(user?.user_metadata?.date_format  ?? 'DD/MM/YYYY')
  const [language,    setLanguage]    = useState(user?.user_metadata?.language     ?? 'en')
  const [landingPage, setLandingPage] = useState(user?.user_metadata?.landing_page ?? '/dashboard')

  // Stats
  const [stats, setStats] = useState({ txCount: null, netWorth: null, budgetCount: null })

  useEffect(() => {
    if (!user?.id) return
    async function loadStats() {
      const [{ count: txCount }, { data: cards }, { count: budgetCount }, { data: allTxs }] = await Promise.all([
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_deleted', false),
        supabase.from('cards').select('id, initial_balance, type').eq('user_id', user.id),
        supabase.from('budgets').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('transactions')
          .select('type, amount, is_split_parent')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .eq('is_split_parent', false),
      ])
      // Account balance = initial balances of debit+savings cards + net of all transactions
      const initialBal = (cards ?? []).filter(c => ['debit','savings'].includes(c.type)).reduce((s, c) => s + Number(c.initial_balance ?? 0), 0)
      const txNet = (allTxs ?? []).reduce((s, t) => {
        if (t.type === 'income')   return s + t.amount
        if (t.type === 'expense')  return s - t.amount
        if (t.type === 'cash_out') return s - t.amount
        if (t.type === 'invest')   return s - t.amount
        return s
      }, 0)
      const netWorth = initialBal + txNet
      setStats({ txCount: txCount ?? 0, netWorth, budgetCount: budgetCount ?? 0 })
    }
    loadStats()
  }, [user?.id])

  const fileRef   = useRef(null)
  const savedName = useRef(displayName)

  const created = user?.created_at ? new Date(user.created_at) : null
  const memberMonths = created
    ? Math.max(1, Math.round((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : null
  const memberSince = created
    ? created.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  const initials = (displayName || user?.email || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  async function handleNameBlur() {
    if (displayName === savedName.current) return
    setSaving(true)
    await supabase.auth.updateUser({ data: { full_name: displayName } })
    savedName.current = displayName
    setSaving(false)
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } })
      setAvatarUrl(data.publicUrl + '?t=' + Date.now())
    }
    setUploading(false)
  }

  async function handleResetPassword() {
    await supabase.auth.resetPasswordForEmail(user.email)
    setResetSent(true)
  }

  async function savePref(key, value) {
    await supabase.auth.updateUser({ data: { [key]: value } })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        {/* ── Hero card ── */}
        <div className="relative rounded-2xl overflow-hidden"
          style={{ background: 'color-mix(in srgb, var(--color-accent) 8%, var(--color-dash-card))', border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)' }}>
          {/* Subtle accent glow top-right */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 18%, transparent) 0%, transparent 70%)' }} />

          <div className="relative z-10 flex items-center gap-6 p-6">
            {/* Avatar */}
            <button onClick={() => fileRef.current?.click()}
              className="relative shrink-0 group cursor-pointer">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-transparent"
                style={{ ringColor: 'var(--color-accent)', boxShadow: '0 0 0 2px var(--color-accent)' }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl font-bold"
                      style={{ background: 'color-mix(in srgb, var(--color-accent) 25%, rgba(255,255,255,0.05))' }}>
                      {initials}
                    </div>
                }
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? <span className="text-white text-[10px]">{t('set.uploading')}</span> : <Camera size={16} className="text-white" />}
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            {/* Name + email + member */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  onBlur={handleNameBlur}
                  placeholder={t('set.yourName')}
                  className="bg-transparent text-2xl font-bold text-white outline-none placeholder:text-white/20 w-full"
                />
                {saving && <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-muted">{t('set.saving')}</span>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Mail size={11} className="text-muted shrink-0" />
                <span className="text-xs text-muted">{user?.email}</span>
              </div>
              {memberSince && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
                  style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
                  {t('set.memberSince', { date: memberSince })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stat tiles ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Layers,    label: t('set.transactions'), value: stats.txCount === null ? '…' : stats.txCount.toLocaleString() },
            { icon: Wallet,    label: t('set.balance'),      value: stats.netWorth === null ? '…' : fmt(stats.netWorth) },
            { icon: TrendingUp, label: t('set.activeBudgets'), value: stats.budgetCount === null ? '…' : stats.budgetCount },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col gap-2 px-4 py-3.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-1.5 text-muted">
                <Icon size={12} />
                <span className="text-[10px] uppercase tracking-widest">{label}</span>
              </div>
              <span className="text-xl font-bold tabular-nums text-white">{value}</span>
            </div>
          ))}
        </div>

        {/* ── Preferences + Security side by side ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preferences */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest px-1">{t('set.preferences')}</label>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 flex flex-col gap-4">
              <SelectRow icon={DollarSign} label={t('set.currency')}    value={currency}    onChange={v => { setCurrency(v);    savePref('currency', v) }}    options={CURRENCIES}    />
              <SelectRow icon={Calendar}   label={t('set.dateFormat')}  value={dateFormat}  onChange={v => { setDateFormat(v);  savePref('date_format', v) }}  options={DATE_FORMATS}  />
              <SelectRow icon={Globe}      label={t('set.language')}    value={language}    onChange={v => { setLanguage(v);    savePref('language', v) }}     options={LANGUAGES}     />
              <SelectRow icon={Home}       label={t('set.defaultPage')} value={landingPage} onChange={v => { setLandingPage(v); savePref('landing_page', v) }} options={LANDING_PAGES} />
            </div>
          </div>

          {/* Security + Sign out */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted uppercase tracking-widest px-1">{t('set.security')}</label>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-muted">{t('set.password')}</p>
                {resetSent
                  ? <p className="text-sm text-green-400">{t('set.resetSent')}</p>
                  : (
                    <button onClick={handleResetPassword}
                      className="flex items-center gap-2 w-fit px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white hover:bg-white/10 transition-colors">
                      <KeyRound size={12} /> {t('set.sendReset')}
                    </button>
                  )
                }
              </div>

              <div className="border-t border-white/[0.06] pt-4">
                <p className="text-xs text-muted mb-2">{t('set.session')}</p>
                <button onClick={() => supabase.auth.signOut()}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut size={12} /> {t('set.signOut')}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}



// ── Data tab ───────────────────────────────────────────────────
function DataTab() {
  const { user } = useAuth()
  const { t } = usePreferences()
  const [confirming, setConfirming] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  async function handleDeleteTransactions() {
    setDeleting(true)
    // Null out FK references first to avoid constraint violations
    await Promise.all([
      supabase.from('wishlist').update({ transaction_id: null }).eq('user_id', user.id),
      supabase.from('pending_items').update({ transaction_id: null }).eq('user_id', user.id),
      supabase.from('planned_bills').update({ transaction_id: null }).eq('user_id', user.id),
      supabase.from('recurring_bill_payments').update({ transaction_id: null }).not('transaction_id', 'is', null),
      supabase.from('subscription_payments').update({ transaction_id: null }).not('transaction_id', 'is', null),
    ])
    // Delete split children before parents (self-referencing FK)
    await supabase.from('transactions').delete().eq('user_id', user.id).not('split_parent_id', 'is', null)
    await supabase.from('transactions').delete().eq('user_id', user.id)
    window.dispatchEvent(new CustomEvent('transaction-saved'))
    setDeleting(false)
    setConfirming(false)
  }

  return (
    <div className="h-full overflow-y-auto"><div className="max-w-lg mx-auto flex flex-col gap-8">
      <p className="text-muted text-sm">{t('set.importExport')}</p>

      <div className="border-t border-white/10 pt-6 flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-medium text-white">{t('set.dangerZone')}</h3>
          <p className="text-xs text-muted mt-0.5">{t('set.dangerDesc')}</p>
        </div>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="w-fit flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            {t('set.deleteData')}
          </button>
        ) : (
          <div className="flex flex-col gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
            <p className="text-sm text-white">{t('set.deleteConfirm')}</p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteTransactions}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-sm text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {deleting ? t('common.deleting') : t('set.deleteYes')}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-sm text-muted hover:text-white transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div></div>
  )
}

// ── Help tab ───────────────────────────────────────────────────
function HelpItem({ icon: Icon, label, description, action, actionLabel = 'Open' }) {
  return (
    <button
      type="button"
      onClick={action}
      className="group flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all w-full"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }}>
        <Icon size={15} style={{ color: 'var(--color-accent)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90">{label}</p>
        <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-white/30 group-hover:text-white/60 transition-colors shrink-0">
        {actionLabel} <ChevronRight size={12} />
      </div>
    </button>
  )
}

function HelpTab({ onTabSwitch }) {
  const navigate = useNavigate()
  const { openTransactionModal } = useTransactionModal()
  const { t } = usePreferences()

  const SECTIONS = [
    {
      title: t('getstarted.title'),
      items: [
        { icon: CreditCard,    label: t('help.addCard'),       description: t('help.addCardDesc'),       action: () => onTabSwitch('cards'),      actionLabel: t('help.goToCards') },
        { icon: BookOpen,      label: t('help.setCats'),        description: t('help.setCatsDesc'),       action: () => onTabSwitch('categories'), actionLabel: t('help.goToLib')   },
        { icon: Receipt,       label: t('help.logTx'),          description: t('help.logTxDesc'),         action: () => openTransactionModal(),    actionLabel: t('help.addNow')    },
        { icon: Target,        label: t('help.createBudget'),   description: t('help.createBudgetDesc'),  action: () => navigate('/budgets'),      actionLabel: t('help.goToBudgets') },
      ],
    },
    {
      title: t('help.dashTitle'),
      items: [
        { icon: LayoutDashboard, label: t('help.overviewTitle'), description: t('help.overviewDesc'),  action: () => navigate('/dashboard'),  actionLabel: t('help.openDash') },
        { icon: Wallet,          label: t('help.accountsTitle'), description: t('help.accountsDesc'),  action: () => navigate('/dashboard'),  actionLabel: t('help.openDash') },
        { icon: CalendarDays,    label: t('help.calTitle'),      description: t('help.calDesc'),        action: () => navigate('/calendar'),   actionLabel: t('help.openDash') },
        { icon: PiggyBank,       label: t('help.goalsTitle'),    description: t('help.goalsDesc'),      action: () => navigate('/savings'),    actionLabel: t('help.openDash') },
      ],
    },
    {
      title: t('help.analyticsTitle'),
      items: [
        { icon: BarChart2,     label: t('help.analyticsLabel'), description: t('help.analyticsDesc'),  action: () => navigate('/analytics'), actionLabel: t('help.openDash') },
        { icon: FileText,      label: t('help.summaryLabel'),   description: t('help.summaryDesc'),    action: () => navigate('/summary'),   actionLabel: t('help.openDash') },
        { icon: LineChart,     label: t('help.portLabel'),      description: t('help.portDesc'),       action: () => navigate('/portfolio'), actionLabel: t('help.openDash') },
      ],
    },
    {
      title: t('help.customTitle'),
      items: [
        { icon: Palette,       label: t('help.designsLabel'),  description: t('help.designsDesc'),    action: () => onTabSwitch('appearance'), actionLabel: t('help.goToApp')     },
        { icon: Layers,        label: t('help.cardCustom'),    description: t('help.cardCustomDesc'),  action: () => navigate('/dashboard'),    actionLabel: t('help.openDash')    },
        { icon: User,          label: t('help.prefTitle'),     description: t('help.prefDesc'),        action: () => onTabSwitch('account'),    actionLabel: t('help.goToAccount') },
      ],
    },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div>
          <p className="text-muted text-sm">{t('help.clickHint')}</p>
        </div>
        {SECTIONS.map(({ title, items }) => (
          <div key={title} className="flex flex-col gap-3">
            <h3 className="text-xs text-muted uppercase tracking-widest font-medium">{title}</h3>
            <div className="flex flex-col gap-2">
              {items.map(item => <HelpItem key={item.label} {...item} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────
export default function Settings() {
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') ?? 'account'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [currentDate] = useState(new Date())
  const { t } = usePreferences()

  const TABS = TAB_IDS.map(tab => ({ ...tab, label: t(tab.labelKey) }))

  const TAB_CONTENT = {
    account:    <AccountTab />,
    appearance: <AppearanceTab />,
    categories: <CategoriesTab />,
    cards:      <CardsTab />,
    financial:  <FinancialSituationTab />,
    data:       <DataTab />,
    help:       <HelpTab onTabSwitch={setActiveTab} />,
  }

  return (
    <div className="min-h-screen md:h-screen flex flex-col bg-dash-bg text-white md:overflow-hidden">
      <Navbar currentDate={currentDate} onPrev={() => {}} onNext={() => {}} />

      <div className="flex-1 flex flex-col md:overflow-hidden py-6 px-4 md:px-16 pb-24 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{t('set.title')}</h1>

        {/* Tab bar — scrollable on mobile */}
        <div className="flex items-center gap-1 mb-6 shrink-0 overflow-x-auto scrollbar-none pb-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0
                  ${active
                    ? 'bg-white/10 text-white'
                    : 'text-muted hover:text-white hover:bg-white/5'}`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 md:min-h-0 md:overflow-hidden">
          {TAB_CONTENT[activeTab] ?? TAB_CONTENT['account']}
        </div>
      </div>
    </div>
  )
}
