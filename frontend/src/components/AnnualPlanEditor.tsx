import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Save, Loader2, CheckCircle2 } from 'lucide-react'
import {
  fetchAnnualPlan,
  addSubKpi, updateSubKpi, deleteSubKpi,
  addSubKpiItem, updateSubKpiItem, deleteSubKpiItem,
  addSegment, updateSegment, deleteSegment,
  deleteKpi, addAnnualPlanKpi, updateKPI,
  type AnnualPlanKpi, type AnnualPlanTask, type AnnualPlanItem, type Segment,
} from '../api/client'
import { KPI_COLORS } from './GanttChart'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function toStartDate(year: number, m: number) {
  return `${year}-${String(m + 1).padStart(2, '0')}-01`
}
function toEndDate(year: number, m: number) {
  return `${year}-${String(m + 1).padStart(2, '0')}-${String(lastDayOfMonth(year, m)).padStart(2, '0')}`
}
function toMonth(dateStr: string | null): number {
  if (!dateStr) return 0
  return parseInt(dateStr.split('-')[1]) - 1
}

// ── Segment row ───────────────────────────────────────────────────────────────

function SegmentRow({ seg, year, onReload }: { seg: Segment; year: number; onReload: () => void }) {
  const [startM, setStartM]   = useState(toMonth(seg.start_date))
  const [endM, setEndM]       = useState(toMonth(seg.end_date))
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [deleting, setDeleting] = useState(false)

  const save = async () => {
    setSaving(true)
    await updateSegment(seg.id, {
      start_date: toStartDate(year, startM),
      end_date:   toEndDate(year, Math.max(endM, startM)),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 1200)
  }

  const del = async () => {
    setDeleting(true)
    await deleteSegment(seg.id)
    onReload()
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/60
      border border-slate-200 dark:border-slate-700 rounded-lg">
      <select
        value={startM}
        onChange={e => { const v = +e.target.value; setStartM(v); if (v > endM) setEndM(v) }}
        className="text-[11px] px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {MONTH_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
      </select>
      <span className="text-[11px] text-slate-400">→</span>
      <select
        value={endM}
        onChange={e => setEndM(+e.target.value)}
        className="text-[11px] px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {MONTH_NAMES.map((n, i) => <option key={i} value={i} disabled={i < startM}>{n}</option>)}
      </select>
      <div className="flex items-center gap-1 ml-auto">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold
            bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
            : saved ? <CheckCircle2 className="w-2.5 h-2.5" />
            : <Save className="w-2.5 h-2.5" />}
          {saved ? '已存' : '存'}
        </button>
        <button onClick={del} disabled={deleting}
          className="p-0.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors">
          {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        </button>
      </div>
    </div>
  )
}

// ── Item card (highlight style) ───────────────────────────────────────────────

function ItemCard({ item, year, onReload }: { item: AnnualPlanItem; year: number; onReload: () => void }) {
  const [content, setContent] = useState(item.content)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [addingSeg, setAddingSeg] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [content])

  const saveContent = async () => {
    setSaving(true)
    await updateSubKpiItem(item.id, { content })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const del = async () => {
    setDeleting(true)
    await deleteSubKpiItem(item.id)
    onReload()
  }

  const handleAddSegment = async () => {
    setAddingSeg(true)
    await addSegment(item.id, {
      start_date: toStartDate(year, 0),
      end_date:   toEndDate(year, 0),
    })
    setAddingSeg(false)
    onReload()
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800">
        <span className="flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center
          text-[10px] font-bold bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800
          text-blue-600 dark:text-blue-400">
          {item.order_index + 1}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={saveContent} disabled={saving}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold
              bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" />
              : saved ? <CheckCircle2 className="w-3 h-3" />
              : <Save className="w-3 h-3" />}
            {saved ? '已存' : '存'}
          </button>
          <button onClick={del} disabled={deleting}
            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors">
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Textarea body */}
      <div className="px-2.5 pt-2.5 pb-1.5">
        <textarea
          ref={textRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={2}
          placeholder="項目內容..."
          className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
        />
      </div>

      {/* Segments */}
      <div className="px-2.5 pb-2 space-y-1.5">
        {item.segments.map(seg => (
          <SegmentRow key={seg.id} seg={seg} year={year} onReload={onReload} />
        ))}
        <button onClick={handleAddSegment} disabled={addingSeg}
          className="flex items-center gap-1 text-[11px] font-medium
            text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 disabled:opacity-50 transition-colors">
          {addingSeg ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          新增時段
        </button>
      </div>
    </div>
  )
}

// ── Task section ──────────────────────────────────────────────────────────────

function TaskSection({ task, year, color, onReload }: {
  task: AnnualPlanTask; year: number; color: string; onReload: () => void
}) {
  const [editing, setEditing]   = useState(false)
  const [title, setTitle]       = useState(task.title)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [adding, setAdding]     = useState(false)

  const save = async () => {
    setSaving(true)
    await updateSubKpi(task.id, { title })
    setSaving(false); setEditing(false); onReload()
  }

  const del = async () => {
    setDeleting(true)
    await deleteSubKpi(task.id)
    onReload()
  }

  const addItem = async () => {
    setAdding(true)
    await addSubKpiItem(task.id, { content: '' })
    setAdding(false)
    onReload()
  }

  return (
    <div className="border-t border-slate-100 dark:border-slate-800">
      {/* Task header */}
      <div className="flex items-center gap-2 px-3 py-1.5 group"
        style={{ borderLeft: `2px solid ${color}` }}>
        <span className="text-[10px] font-bold text-slate-400 w-6 flex-shrink-0">{task.sub_id}</span>
        {!editing ? (
          <>
            <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300">{task.title}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditing(true)}
                className="px-1.5 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700
                  text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                編輯
              </button>
              <button onClick={del} disabled={deleting}
                className="p-0.5 rounded text-slate-400 hover:text-rose-500 transition-colors">
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              </button>
            </div>
          </>
        ) : (
          <>
            <input value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              className="flex-1 text-xs px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
                focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <button onClick={save} disabled={saving || !title.trim()}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold
                bg-blue-600 text-white disabled:opacity-50">
              {saving ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Save className="w-2.5 h-2.5" />}
            </button>
            <button onClick={() => { setEditing(false); setTitle(task.title) }}
              className="text-[10px] text-slate-400 hover:text-slate-600 px-0.5">✕</button>
          </>
        )}
      </div>

      {/* Item cards */}
      <div className="px-3 py-2 space-y-2">
        {task.items.map(item => (
          <ItemCard key={item.id} item={item} year={year} onReload={onReload} />
        ))}

        <button
          onClick={addItem}
          disabled={adding}
          className="flex items-center gap-1 text-[11px] font-medium
            text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300
            disabled:opacity-50 transition-colors"
        >
          {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          新增項目
        </button>
      </div>
    </div>
  )
}

// ── KPI group section ─────────────────────────────────────────────────────────

function KpiGroupSection({ group, year, onReload }: {
  group: AnnualPlanKpi; year: number; onReload: () => void
}) {
  const color = KPI_COLORS[group.kpi_number] ?? '#60a5fa'
  const [addOpen, setAddOpen]   = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [adding, setAdding]     = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pct, setPct]           = useState<string>(group.percentage != null ? String(group.percentage) : '')
  const [savingPct, setSavingPct] = useState(false)
  const [savedPct, setSavedPct]   = useState(false)

  const savePct = async () => {
    if (!group.kpi_id) return
    setSavingPct(true)
    const val = pct === '' ? null : Math.min(100, Math.max(0, parseInt(pct) || 0))
    await updateKPI(group.kpi_id, { percentage: val })
    setSavingPct(false); setSavedPct(true)
    setTimeout(() => setSavedPct(false), 1200)
    onReload()
  }

  const handleAddTask = async () => {
    if (!addTitle.trim() || !group.kpi_id) return
    setAdding(true)
    const sub_id = `${group.kpi_number}.${group.tasks.length + 1}`
    await addSubKpi(group.kpi_id, { title: addTitle.trim(), sub_id })
    setAddTitle(''); setAddOpen(false); setAdding(false)
    onReload()
  }

  const handleDelete = async () => {
    if (!group.kpi_id) return
    setDeleting(true)
    await deleteKpi(group.kpi_id)
    onReload()
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* KPI header */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2"
        style={{ borderLeft: `3px solid ${color}` }}>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 break-words min-w-0 flex-1">
          {group.kpi_title}
        </span>
        <span className="text-[10px] text-slate-400 flex-shrink-0">{group.tasks.length} 個任務</span>
        {/* Percentage input */}
        {group.kpi_id && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <input
              type="number" min={0} max={100}
              value={pct}
              onChange={e => setPct(e.target.value)}
              onBlur={savePct}
              onKeyDown={e => e.key === 'Enter' && savePct()}
              placeholder="0"
              className="w-12 text-[11px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
                focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
            />
            <span className="text-[11px] text-slate-400">%</span>
            {savingPct && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
            {savedPct  && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
          </div>
        )}
        {group.kpi_id && (
          confirmDel ? (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] text-rose-600 dark:text-rose-400">確認刪除？</span>
              <button onClick={handleDelete} disabled={deleting}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-600 text-white disabled:opacity-50">
                {deleting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : '刪除'}
              </button>
              <button onClick={() => setConfirmDel(false)}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">取消</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)}
              className="p-0.5 rounded text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )
        )}
      </div>

      {/* Tasks */}
      <div>
        {group.tasks.map(task => (
          <TaskSection key={task.id} task={task} year={year} color={color} onReload={onReload} />
        ))}
      </div>

      {/* Add task */}
      {group.kpi_id ? (
        addOpen ? (
          <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100 dark:border-slate-800
            bg-emerald-50/30 dark:bg-emerald-950/10">
            <input autoFocus value={addTitle} onChange={e => setAddTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTask()}
              placeholder="任務名稱..."
              className="flex-1 text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
                focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            <button onClick={handleAddTask} disabled={adding || !addTitle.trim()}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold
                bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors">
              {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              新增
            </button>
            <button onClick={() => { setAddOpen(false); setAddTitle('') }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              取消
            </button>
          </div>
        ) : (
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-1 mx-3 my-1.5 text-xs font-medium
              text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> 新增任務
          </button>
        )
      ) : null}
    </div>
  )
}

// ── AnnualPlanEditor ──────────────────────────────────────────────────────────

export function AnnualPlanEditor({ year }: { year: number }) {
  const [data, setData]       = useState<AnnualPlanKpi[]>([])
  const [loading, setLoading] = useState(false)
  const [addKpiOpen, setAddKpiOpen] = useState(false)
  const [addKpiTitle, setAddKpiTitle] = useState('')
  const [addingKpi, setAddingKpi]    = useState(false)

  const load = () => {
    setLoading(true)
    fetchAnnualPlan(year).then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [year])

  const handleAddKpi = async () => {
    if (!addKpiTitle.trim()) return
    setAddingKpi(true)
    await addAnnualPlanKpi(year, addKpiTitle.trim())
    setAddKpiTitle(''); setAddKpiOpen(false); setAddingKpi(false)
    load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map(group => (
        <KpiGroupSection key={group.kpi_id ?? group.kpi_number} group={group} year={year} onReload={load} />
      ))}

      {/* Add KPI */}
      {addKpiOpen ? (
        <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <input autoFocus value={addKpiTitle} onChange={e => setAddKpiTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddKpi()}
            placeholder="KPI 名稱..."
            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
              focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          <button onClick={handleAddKpi} disabled={addingKpi || !addKpiTitle.trim()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors">
            {addingKpi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            新增
          </button>
          <button onClick={() => { setAddKpiOpen(false); setAddKpiTitle('') }}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            取消
          </button>
        </div>
      ) : (
        <button onClick={() => setAddKpiOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium
            text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
          <Plus className="w-4 h-4" /> 新增 KPI
        </button>
      )}
    </div>
  )
}
