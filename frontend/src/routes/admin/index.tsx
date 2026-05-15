import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Loader2, Plus, Trash2, Save, CheckCircle2 } from 'lucide-react'
import {
  fetchWeeks, fetchKPIsByWeek, fetchKPI,
  createWeek, updateKPI,
  type Week, type KPIListItem, type KPI,
} from '../../api/client'

export const Route = createFileRoute('/admin/')({ component: AdminPanel })

const STATUS_OPTIONS = [
  { value: 'not_started', label: '未開始' },
  { value: 'in_progress', label: '進行中' },
  { value: 'completed',   label: '已完成' },
]

const STATUS_STYLE: Record<string, string> = {
  completed:   'border-emerald-500 text-emerald-700 dark:text-emerald-300',
  in_progress: 'border-blue-500 text-blue-700 dark:text-blue-300',
  not_started: 'border-slate-300 text-slate-500',
}

function StringListEditor({
  label, items, onChange, accent,
}: {
  label: string
  items: string[]
  onChange: (v: string[]) => void
  accent: 'emerald' | 'rose'
}) {
  const add = () => onChange([...items, ''])
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i))
  const update = (i: number, v: string) => onChange(items.map((x, j) => (j === i ? v : x)))

  const addBtn = accent === 'emerald'
    ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 border-emerald-200 dark:border-emerald-800'
    : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 border-rose-200 dark:border-rose-800'
  const numStyle = accent === 'emerald'
    ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
    : 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</span>
        <button
          onClick={add}
          className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${addBtn} transition-colors`}
        >
          <Plus className="w-3 h-3" /> 新增
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${numStyle}`}>
              {i + 1}
            </span>
            <textarea
              value={item}
              onChange={e => update(i, e.target.value)}
              rows={2}
              className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={() => remove(i)}
              className="mt-1 p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-slate-400 italic px-1">無項目</p>
        )}
      </div>
    </div>
  )
}

function KpiEditCard({
  kpiId, title, onSaved,
}: { kpiId: number; title: string; onSaved: () => void }) {
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [status, setStatus] = useState('not_started')
  const [highlights, setHighlights] = useState<string[]>([])
  const [lowlights, setLowlights] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchKPI(kpiId).then(data => {
      setKpi(data)
      setStatus(data.status)
      setHighlights(data.highlights.map(h => h.content))
      setLowlights(data.lowlights.map(l => l.content))
    })
  }, [kpiId])

  const save = async () => {
    setSaving(true)
    try {
      await updateKPI(kpiId, { status, highlights, lowlights })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  if (!kpi) return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-center">
      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Card header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</span>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
            bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <Save className="w-3 h-3" />
          )}
          {saved ? '已儲存' : '儲存'}
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Status selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
            Status
          </label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  status === opt.value
                    ? `${STATUS_STYLE[opt.value]} bg-white dark:bg-slate-800 shadow-sm`
                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Highlights + Lowlights side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StringListEditor
            label="Highlight"
            items={highlights}
            onChange={setHighlights}
            accent="emerald"
          />
          <StringListEditor
            label="Lowlight"
            items={lowlights}
            onChange={setLowlights}
            accent="rose"
          />
        </div>
      </div>
    </div>
  )
}

function AdminPanel() {
  const [weeks, setWeeks] = useState<Week[]>([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [tabs, setTabs] = useState<KPIListItem[]>([])
  const [newDate, setNewDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const loadWeeks = () =>
    fetchWeeks().then(list => {
      setWeeks(list)
      if (list.length > 0 && !selectedWeek) setSelectedWeek(list[0].week_date)
    })

  useEffect(() => { loadWeeks() }, [])

  useEffect(() => {
    if (!selectedWeek) return
    fetchKPIsByWeek(selectedWeek).then(setTabs)
  }, [selectedWeek])

  const handleCreateWeek = async () => {
    if (!newDate) return
    setCreating(true)
    setCreateError('')
    try {
      await createWeek(newDate)
      setNewDate('')
      await loadWeeks()
      setSelectedWeek(newDate)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setCreateError(msg)
    } finally {
      setCreating(false)
    }
  }

  const reloadTabs = () => {
    if (selectedWeek) fetchKPIsByWeek(selectedWeek).then(setTabs)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          Admin Panel
        </h2>
      </div>

      {/* Week management bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">週份管理</span>
        </div>
        <div className="px-4 py-4 flex flex-wrap items-end gap-4">
          {/* Existing week selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">選擇週份</label>
            <select
              value={selectedWeek}
              onChange={e => setSelectedWeek(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {weeks.map(w => (
                <option key={w.week_date} value={w.week_date}>{w.week_date}</option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-700" />

          {/* New week creation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">建立新週份</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCreateWeek}
                disabled={creating || !newDate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold
                  bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                建立
              </button>
            </div>
            {createError && <p className="text-xs text-rose-500">{createError}</p>}
          </div>
        </div>
      </div>

      {/* KPI edit cards */}
      {selectedWeek && tabs.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {selectedWeek} — KPI 編輯
          </p>
          {tabs.map(tab => (
            <KpiEditCard
              key={tab.id}
              kpiId={tab.id}
              title={tab.title}
              onSaved={reloadTabs}
            />
          ))}
        </div>
      )}

      {selectedWeek && tabs.length === 0 && (
        <p className="text-sm text-slate-400 italic text-center py-8">此週份尚無 KPI 資料</p>
      )}
    </div>
  )
}
