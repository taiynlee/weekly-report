import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import {
  Loader2, Plus, Trash2, Save, CheckCircle2, Sparkles,
  Link2, ImageIcon, VideoIcon, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  fetchWeeks, fetchKPIsByWeek, fetchKPI,
  createWeek, updateKPI,
  addHighlight, updateHighlight, deleteHighlight, generateHighlight, uploadHighlightFile,
  addLowlight, updateLowlight, deleteLowlight, generateLowlight, uploadLowlightFile,
  type Week, type KPIListItem, type KPI, type HighlightItem, type LowlightItem,
} from '../../api/client'

export const Route = createFileRoute('/admin/')({ component: AdminPanel })

const STATUS_OPTIONS = [
  { value: 'not_started', label: '未開始', dot: 'bg-slate-400', badge: 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400' },
  { value: 'in_progress', label: '進行中', dot: 'bg-blue-500',  badge: 'border-blue-400 text-blue-600 dark:border-blue-600 dark:text-blue-400' },
  { value: 'completed',   label: '已完成', dot: 'bg-emerald-500', badge: 'border-emerald-400 text-emerald-600 dark:border-emerald-600 dark:text-emerald-400' },
]

type ItemType = 'highlight' | 'lowlight'

function ItemEditor({
  item, type, kpiId,
  onUpdate, onDelete,
}: {
  item: HighlightItem | LowlightItem
  type: ItemType
  kpiId: number
  onUpdate: (updated: HighlightItem | LowlightItem) => void
  onDelete: () => void
}) {
  const [content, setContent]       = useState(item.content)
  const [status, setStatus]         = useState(item.status)
  const [llmPrompt, setLlmPrompt]   = useState(item.llm_prompt ?? '')
  const [link, setLink]             = useState(item.link ?? '')
  const [expanded, setExpanded]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading]   = useState<'image' | 'video' | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const doUpdate = (patch: Parameters<typeof updateHighlight>[1]) => {
    const fn = type === 'highlight' ? updateHighlight : updateLowlight
    return fn(item.id, patch).then(onUpdate)
  }

  const save = async () => {
    setSaving(true)
    try {
      await doUpdate({ content, status, llm_prompt: llmPrompt || undefined, link: link || undefined })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  const generate = async () => {
    if (!llmPrompt) return
    setGenerating(true)
    try {
      const fn = type === 'highlight' ? generateHighlight : generateLowlight
      const updated = await fn(item.id, llmPrompt)
      setContent(updated.content)
      onUpdate(updated)
    } finally { setGenerating(false) }
  }

  const uploadFile = async (field: 'image_path' | 'video_path', file: File) => {
    setUploading(field === 'image_path' ? 'image' : 'video')
    try {
      const fn = type === 'highlight' ? uploadHighlightFile : uploadLowlightFile
      await fn(item.id, field, file)
      const refetch = type === 'highlight' ? updateHighlight : updateLowlight
      const updated = await refetch(item.id, {})
      onUpdate(updated)
    } finally { setUploading(null) }
  }

  const numStyle = type === 'highlight'
    ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
    : 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      {/* Item header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800">
        <span className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${numStyle}`}>
          {item.order_index + 1}
        </span>

        {/* Status pills */}
        <div className="flex gap-1">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                status === opt.value
                  ? `${opt.badge} bg-white dark:bg-slate-900`
                  : 'border-transparent text-slate-400 hover:border-slate-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="展開進階欄位"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold
              bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {saved ? '已存' : '存'}
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Content */}
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={2}
          placeholder="內容..."
          className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        {expanded && (
          <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-slate-700">
            {/* LLM prompt */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                LLM Prompt
              </label>
              <div className="flex gap-2">
                <textarea
                  value={llmPrompt}
                  onChange={e => setLlmPrompt(e.target.value)}
                  rows={2}
                  placeholder="輸入指令讓 Claude 更新內容..."
                  className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                    bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
                    focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <button
                  onClick={generate}
                  disabled={generating || !llmPrompt}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold self-end
                    bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-colors"
                >
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  生成
                </button>
              </div>
            </div>

            {/* Link */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                連結
              </label>
              <div className="flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <input
                  type="url"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                    bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                圖片
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => imageRef.current?.click()}
                  disabled={uploading === 'image'}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                    border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800
                    text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-colors"
                >
                  {uploading === 'image' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  上傳圖片
                </button>
                {item.image_path && (
                  <a href={item.image_path} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-500 underline truncate max-w-xs">
                    {item.image_path.split('/').pop()}
                  </a>
                )}
                <input ref={imageRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadFile('image_path', e.target.files[0])} />
              </div>
              {item.image_path && (
                <img src={item.image_path} alt="" className="mt-2 max-h-32 rounded-lg border border-slate-200 dark:border-slate-700 object-contain" />
              )}
            </div>

            {/* Video */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                影片
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => videoRef.current?.click()}
                  disabled={uploading === 'video'}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                    border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800
                    text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-colors"
                >
                  {uploading === 'video' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <VideoIcon className="w-3.5 h-3.5" />}
                  上傳影片
                </button>
                {item.video_path && (
                  <a href={item.video_path} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-500 underline truncate max-w-xs">
                    {item.video_path.split('/').pop()}
                  </a>
                )}
                <input ref={videoRef} type="file" accept="video/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadFile('video_path', e.target.files[0])} />
              </div>
              {item.video_path && (
                <video src={item.video_path} controls className="mt-2 max-h-40 rounded-lg border border-slate-200 dark:border-slate-700 w-full" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiEditCard({ kpiId, onSaved }: { kpiId: number; onSaved: () => void }) {
  const [kpi, setKpi]         = useState<KPI | null>(null)
  const [title, setTitle]     = useState('')
  const [savingTitle, setSavingTitle] = useState(false)
  const [titleSaved, setTitleSaved]   = useState(false)

  const reload = () => fetchKPI(kpiId).then(data => { setKpi(data); setTitle(data.title) })

  useEffect(() => { reload() }, [kpiId])

  const saveTitle = async () => {
    setSavingTitle(true)
    try {
      await updateKPI(kpiId, { title })
      setTitleSaved(true); setTimeout(() => setTitleSaved(false), 2000)
      onSaved()
    } finally { setSavingTitle(false) }
  }

  const handleUpdateItem = (type: ItemType, id: number, updated: HighlightItem | LowlightItem) => {
    setKpi(prev => {
      if (!prev) return prev
      const key = type === 'highlight' ? 'highlights' : 'lowlights'
      return { ...prev, [key]: (prev[key] as (HighlightItem | LowlightItem)[]).map(x => x.id === id ? updated : x) }
    })
  }

  const handleDeleteItem = async (type: ItemType, id: number) => {
    const fn = type === 'highlight' ? deleteHighlight : deleteLowlight
    await fn(id)
    setKpi(prev => {
      if (!prev) return prev
      const key = type === 'highlight' ? 'highlights' : 'lowlights'
      return { ...prev, [key]: (prev[key] as (HighlightItem | LowlightItem)[]).filter(x => x.id !== id) }
    })
  }

  const handleAddItem = async (type: ItemType) => {
    const fn = type === 'highlight' ? addHighlight : addLowlight
    const newItem = await fn(kpiId)
    setKpi(prev => {
      if (!prev) return prev
      const key = type === 'highlight' ? 'highlights' : 'lowlights'
      return { ...prev, [key]: [...(prev[key] as (HighlightItem | LowlightItem)[]), newItem] }
    })
  }

  if (!kpi) return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex justify-center">
      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* KPI title editor */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="flex-1 text-sm font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={saveTitle}
            disabled={savingTitle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
          >
            {savingTitle ? <Loader2 className="w-3 h-3 animate-spin" /> : titleSaved ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {titleSaved ? '已存' : '存標題'}
          </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Highlights */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Highlight</span>
            <button
              onClick={() => handleAddItem('highlight')}
              className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border
                border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400
                hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
            >
              <Plus className="w-3 h-3" /> 新增
            </button>
          </div>
          <div className="space-y-2">
            {kpi.highlights.map(h => (
              <ItemEditor
                key={h.id} item={h} type="highlight" kpiId={kpiId}
                onUpdate={updated => handleUpdateItem('highlight', h.id, updated)}
                onDelete={() => handleDeleteItem('highlight', h.id)}
              />
            ))}
            {kpi.highlights.length === 0 && <p className="text-xs text-slate-400 italic">無項目</p>}
          </div>
        </div>

        {/* Lowlights */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Lowlight</span>
            <button
              onClick={() => handleAddItem('lowlight')}
              className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border
                border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400
                hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
            >
              <Plus className="w-3 h-3" /> 新增
            </button>
          </div>
          <div className="space-y-2">
            {kpi.lowlights.map(l => (
              <ItemEditor
                key={l.id} item={l} type="lowlight" kpiId={kpiId}
                onUpdate={updated => handleUpdateItem('lowlight', l.id, updated)}
                onDelete={() => handleDeleteItem('lowlight', l.id)}
              />
            ))}
            {kpi.lowlights.length === 0 && <p className="text-xs text-slate-400 italic">無項目</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminPanel() {
  const [weeks, setWeeks]           = useState<Week[]>([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [tabs, setTabs]             = useState<KPIListItem[]>([])
  const [activeKpiId, setActiveKpiId]   = useState<number | null>(null)
  const [newDate, setNewDate]       = useState('')
  const [creating, setCreating]     = useState(false)
  const [createError, setCreateError] = useState('')

  const loadWeeks = () =>
    fetchWeeks().then(list => {
      setWeeks(list)
      if (list.length > 0 && !selectedWeek) setSelectedWeek(list[0].week_date)
    })

  useEffect(() => { loadWeeks() }, [])

  useEffect(() => {
    if (!selectedWeek) return
    fetchKPIsByWeek(selectedWeek).then(list => {
      setTabs(list)
      if (list.length > 0) setActiveKpiId(list[0].id)
    })
  }, [selectedWeek])

  const handleCreateWeek = async () => {
    if (!newDate) return
    setCreating(true); setCreateError('')
    try {
      await createWeek(newDate)
      setNewDate('')
      await loadWeeks()
      setSelectedWeek(newDate)
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Error')
    } finally { setCreating(false) }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">Admin Panel</h2>

      {/* Week bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">週份管理</span>
        </div>
        <div className="px-4 py-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">選擇週份</label>
            <select
              value={selectedWeek}
              onChange={e => setSelectedWeek(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {weeks.map(w => <option key={w.week_date} value={w.week_date}>{w.week_date}</option>)}
            </select>
          </div>
          <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">建立新週份</label>
            <div className="flex gap-2">
              <input
                type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCreateWeek} disabled={creating || !newDate}
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

      {/* KPI tab selector */}
      {tabs.length > 0 && (
        <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveKpiId(tab.id)}
              className={`flex-1 min-w-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all truncate ${
                activeKpiId === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.title.replace(/^\d+\.\s*/, '').split('(')[0].trim()}
            </button>
          ))}
        </div>
      )}

      {/* Active KPI editor */}
      {activeKpiId && (
        <KpiEditCard
          key={activeKpiId}
          kpiId={activeKpiId}
          onSaved={() => fetchKPIsByWeek(selectedWeek).then(setTabs)}
        />
      )}
    </div>
  )
}
