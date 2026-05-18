import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Loader2, Check } from 'lucide-react'
import {
  fetchSchedule, createScheduleTask, updateScheduleTask, deleteScheduleTask,
  type ScheduleByKpi, type ScheduleTask,
} from '../api/client'
import { KPI_COLORS } from './GanttChart'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function lastDay(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function toStartDate(year: number, m: number) {
  return `${year}-${String(m + 1).padStart(2, '0')}-01`
}
function toEndDate(year: number, m: number) {
  return `${year}-${String(m + 1).padStart(2, '0')}-${String(lastDay(year, m)).padStart(2, '0')}`
}
function toMonth(dateStr: string) {
  return new Date(dateStr).getMonth()
}

interface TaskRowProps {
  task: ScheduleTask
  onUpdate: (id: number, title: string, sm: number, em: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
}
function TaskRow({ task, onUpdate, onDelete }: TaskRowProps) {
  const [editing, setEditing]   = useState(false)
  const [title, setTitle]       = useState(task.title)
  const [startM, setStartM]     = useState(toMonth(task.start_date))
  const [endM, setEndM]         = useState(toMonth(task.end_date))
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [deleting, setDeleting] = useState(false)

  const save = async () => {
    setSaving(true)
    await onUpdate(task.id, title, startM, Math.max(endM, startM))
    setSaving(false); setSaved(true); setTimeout(() => { setSaved(false); setEditing(false) }, 1000)
  }

  const del = async () => {
    setDeleting(true)
    await onDelete(task.id)
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
        <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">{task.title}</span>
        <span className="text-xs text-slate-400 tabular-nums">
          {MONTH_NAMES[toMonth(task.start_date)]} – {MONTH_NAMES[toMonth(task.end_date)]}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)}
            className="px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200 dark:border-slate-700
              text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            編輯
          </button>
          <button onClick={del} disabled={deleting}
            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors">
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50">
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="flex-1 text-sm px-2 py-1 rounded border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
          focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <select value={startM} onChange={e => setStartM(+e.target.value)}
        className="text-xs px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500">
        {MONTH_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
      </select>
      <span className="text-xs text-slate-400">–</span>
      <select value={endM} onChange={e => setEndM(+e.target.value)}
        className="text-xs px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500">
        {MONTH_NAMES.map((n, i) => <option key={i} value={i} disabled={i < startM}>{n}</option>)}
      </select>
      <button onClick={save} disabled={saving || !title.trim()}
        className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold
          bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors">
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
      </button>
      <button onClick={() => setEditing(false)}
        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors px-1">
        取消
      </button>
    </div>
  )
}

interface AddFormProps {
  onCreate: (title: string, sm: number, em: number) => Promise<void>
}
function AddForm({ onCreate }: AddFormProps) {
  const [open, setOpen]     = useState(false)
  const [title, setTitle]   = useState('')
  const [startM, setStartM] = useState(0)
  const [endM, setEndM]     = useState(0)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onCreate(title.trim(), startM, Math.max(endM, startM))
    setTitle(''); setStartM(0); setEndM(0); setOpen(false); setSaving(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1 mx-3 my-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400
          hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
        <Plus className="w-3.5 h-3.5" /> 新增任務
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/50 dark:bg-emerald-950/20 border-t border-slate-100 dark:border-slate-800">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()}
        placeholder="任務名稱..."
        className="flex-1 text-sm px-2 py-1 rounded border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
          focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      <select value={startM} onChange={e => { setStartM(+e.target.value); if (+e.target.value > endM) setEndM(+e.target.value) }}
        className="text-xs px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
        {MONTH_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
      </select>
      <span className="text-xs text-slate-400">–</span>
      <select value={endM} onChange={e => setEndM(+e.target.value)}
        className="text-xs px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
        {MONTH_NAMES.map((n, i) => <option key={i} value={i} disabled={i < startM}>{n}</option>)}
      </select>
      <button onClick={save} disabled={saving || !title.trim()}
        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold
          bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors">
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
        新增
      </button>
      <button onClick={() => setOpen(false)}
        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
        取消
      </button>
    </div>
  )
}

export function ScheduleEditor({ year }: { year: number }) {
  const [data, setData]     = useState<ScheduleByKpi[]>([])
  const [loading, setLoading] = useState(false)

  const load = () => {
    setLoading(true)
    fetchSchedule(year).then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [year])

  const handleCreate = async (kpi_number: number, title: string, sm: number, em: number) => {
    await createScheduleTask({ year, kpi_number, title, start_date: toStartDate(year, sm), end_date: toEndDate(year, em) })
    load()
  }

  const handleUpdate = async (id: number, title: string, sm: number, em: number) => {
    await updateScheduleTask(id, { title, start_date: toStartDate(year, sm), end_date: toEndDate(year, em) })
    load()
  }

  const handleDelete = async (id: number) => {
    await deleteScheduleTask(id)
    load()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="space-y-3">
      {data.map(group => {
        const color = KPI_COLORS[group.kpi_number] ?? '#60a5fa'
        return (
          <div key={group.kpi_number}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2"
              style={{ borderLeft: `3px solid ${color}` }}>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {group.kpi_title}
              </span>
              <span className="ml-auto text-[10px] text-slate-400">{group.tasks.length} 個任務</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {group.tasks.map(task => (
                <TaskRow key={task.id} task={task}
                  onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </div>
            <AddForm onCreate={(title, sm, em) => handleCreate(group.kpi_number, title, sm, em)} />
          </div>
        )
      })}
    </div>
  )
}
