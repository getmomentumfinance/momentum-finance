import { Tag, Plus } from 'lucide-react'

export default function CategoryBudgets({ currentDate }) {
  const label = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base">Category Budgets</span>
          <span className="text-muted text-xs">({label})</span>
        </div>
        <button className="flex items-center gap-1 text-muted hover:text-white text-xs transition-colors">
          <Plus size={14} /> Add Budget
        </button>
      </div>
      <p className="text-center text-muted text-sm py-6">No budgets set</p>
    </div>
  )
}
