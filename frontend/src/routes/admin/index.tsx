import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import {
  Loader2, Plus, Trash2, Save, CheckCircle2, Sparkles,
  Link2, ImageIcon, VideoIcon, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Clipboard, Target, Star,
} from 'lucide-react'
import {
  fetchWeeks, fetchKPIsByWeek, fetchKPI,
  createWeek, updateKPI,
  addHighlight, updateHighlight, deleteHighlight, generateHighlight,
  uploadHighlightFile, addHighlightLink, deleteHighlightMedia,
  type Week, type KPIListItem, type KPI, type HighlightItem, type SubKPIIn,
} from '../../api/client'

export const Route = createFileRoute('/admin/')({ component: AdminPanel })

const STATUS_OPTIONS = [
  { value: 'not_started', label: '未開始', dot: 'bg-slate-400', badge: 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400' },
  { value: 'in_progress', label: '進行中', dot: 'bg-blue-500',  badge: 'border-blue-400 text-blue-600 dark:border-blue-600 dark:text-blue-400' },
  { value: 'completed',   label: '已完成', dot: 'bg-emerald-500', badge: 'border-emerald-400 text-emerald-600 dark:border-emerald-600 dark:text-emerald-400' },
]

function ItemEditor({
  item, kpiId,
  onUpdate, onDelete,
}: {
  item: HighlightItem
  kpiId: number
  onUpdate: (updated: HighlightItem) => void
  onDelete: () => void
}) {
  const [content, setContent]       = useState(item.content)
  const [llmPrompt, setLlmPrompt]   = useState(item.llm_prompt ?? '')
  const [newLink, setNewLink]       = useState('')
  const [percentage, setPercentage] = useState<string>(item.percentage != null ? String(item.percentage) : '')
  const [fraction, setFraction]     = useState('')
  const [expanded, setExpanded]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading]   = useState<'image' | 'video' | null>(null)
  const [addingLink, setAddingLink] = useState(false)
  const imageRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const links  = item.media.filter(m => m.media_type === 'link')
  const images = item.media.filter(m => m.media_type === 'image')
  const videos = item.media.filter(m => m.media_type === 'video')

  const save = async () => {
    setSaving(true)
    try {
      const pct = percentage !== '' ? parseInt(percentage) : undefined
      const updated = await updateHighlight(item.id, {
        content,
        llm_prompt: llmPrompt || undefined,
        percentage: pct,
      })
      onUpdate(updated)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  const addLink = async () => {
    if (!newLink.trim()) return
    setAddingLink(true)
    try {
      const updated = await addHighlightLink(item.id, newLink.trim())
      onUpdate(updated)
      setNewLink('')
    } finally { setAddingLink(false) }
  }

  const generate = async () => {
    if (!llmPrompt) return
    setGenerating(true)
    try {
      const updated = await generateHighlight(item.id, llmPrompt)
      setContent(updated.content)
      onUpdate(updated)
    } finally { setGenerating(false) }
  }

  const uploadFile = async (field: 'image' | 'video', file: File) => {
    setUploading(field)
    try {
      const updated = await uploadHighlightFile(item.id, field, file)
      onUpdate(updated)
    } finally { setUploading(null) }
  }

  const removeMedia = async (mediaId: number) => {
    await deleteHighlightMedia(mediaId)
    onUpdate({ ...item, media: item.media.filter(m => m.id !== mediaId) })
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      {/* Item header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800">
        <span className="flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
          {item.order_index + 1}
        </span>

        {/* Percentage input */}
        <div className="flex items-center gap-1 ml-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">完成度</span>
          <input
            type="number"
            min={0} max={100}
            value={percentage}
            onChange={e => setPercentage(e.target.value)}
            className="w-12 text-xs px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
              focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
          />
          <span className="text-[11px] text-slate-400">%</span>
          <input
            type="text"
            value={fraction}
            onChange={e => {
              const val = e.target.value
              setFraction(val)
              const m = val.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/)
              if (m) {
                const den = parseFloat(m[2])
                if (den > 0) setPercentage(String(Math.min(100, Math.round(parseFloat(m[1]) / den * 100))))
              }
            }}
            placeholder=""
            className="w-10 text-xs px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
              focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
          />
        </div>

        {/* Field presence indicators */}
        <div className="flex items-center gap-0.5 ml-1">
          {links.length > 0 && (
            <span className="flex items-center gap-0.5 p-0.5 text-blue-500 dark:text-blue-400" title={`${links.length}個連結`}>
              <Link2 className="w-3 h-3" />
              {links.length > 1 && <span className="text-[10px] font-bold">{links.length}</span>}
            </span>
          )}
          {images.length > 0 && (
            <span className="flex items-center gap-0.5 p-0.5 text-emerald-500 dark:text-emerald-400" title={`${images.length}張圖片`}>
              <ImageIcon className="w-3 h-3" />
              {images.length > 1 && <span className="text-[10px] font-bold">{images.length}</span>}
            </span>
          )}
          {videos.length > 0 && (
            <span className="flex items-center gap-0.5 p-0.5 text-purple-500 dark:text-purple-400" title={`${videos.length}部影片`}>
              <VideoIcon className="w-3 h-3" />
              {videos.length > 1 && <span className="text-[10px] font-bold">{videos.length}</span>}
            </span>
          )}
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

            {/* Links */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                連結
              </label>
              <div className="space-y-1.5">
                {links.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <a href={m.url} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-500 underline truncate flex-1">
                      {m.url}
                    </a>
                    <button
                      onClick={() => removeMedia(m.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors flex-shrink-0"
                      title="刪除連結"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-1.5">
                <input
                  type="url"
                  value={newLink}
                  onChange={e => setNewLink(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addLink()}
                  placeholder="https://..."
                  className="flex-1 text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                    bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addLink}
                  disabled={addingLink || !newLink.trim()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                    bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
                >
                  {addingLink ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  新增
                </button>
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                圖片
              </label>
              <div className="space-y-1.5">
                {images.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <a href={m.url} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-500 underline truncate flex-1 max-w-[160px]">
                      {m.url.split('/').pop()}
                    </a>
                    <button
                      onClick={() => removeMedia(m.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors flex-shrink-0"
                      title="刪除圖片"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {images.length > 0 && images.some(m => m.url) && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {images.map(m => (
                      <img key={m.id} src={m.url} alt="" className="max-h-20 rounded border border-slate-200 dark:border-slate-700 object-contain" />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-1.5">
                <button
                  onClick={() => imageRef.current?.click()}
                  disabled={uploading === 'image'}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                    border border-dashed border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800
                    text-slate-500 dark:text-slate-400 disabled:opacity-50 transition-colors"
                >
                  {uploading === 'image' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  新增圖片
                </button>
                <div
                  tabIndex={0}
                  onPaste={e => {
                    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
                    if (!item) return
                    const file = item.getAsFile()
                    if (file) { e.preventDefault(); uploadFile('image', file) }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                    border border-dashed border-slate-300 dark:border-slate-600 text-slate-400
                    hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:text-blue-500
                    cursor-pointer transition-colors select-none"
                >
                  <Clipboard className="w-3.5 h-3.5 flex-shrink-0" />
                  點此後 Ctrl+V 貼上
                </div>
              </div>
              <input ref={imageRef} type="file" accept="image/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) { uploadFile('image', e.target.files[0]); e.target.value = '' } }} />
            </div>

            {/* Videos */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                影片
              </label>
              <div className="space-y-1.5">
                {videos.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <VideoIcon className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                    <a href={m.url} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-500 underline truncate flex-1 max-w-[160px]">
                      {m.url.split('/').pop()}
                    </a>
                    <button
                      onClick={() => removeMedia(m.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors flex-shrink-0"
                      title="刪除影片"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {videos.length > 0 && (
                  <div className="space-y-1 mt-1">
                    {videos.map(m => (
                      <video key={m.id} src={m.url} controls className="max-h-32 rounded-lg border border-slate-200 dark:border-slate-700 w-full" />
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => videoRef.current?.click()}
                disabled={uploading === 'video'}
                className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                  border border-dashed border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800
                  text-slate-500 dark:text-slate-400 disabled:opacity-50 transition-colors"
              >
                {uploading === 'video' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                新增影片
              </button>
              <input ref={videoRef} type="file" accept="video/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) { uploadFile('video', e.target.files[0]); e.target.value = '' } }} />
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
  const [kpiStatus, setKpiStatus] = useState('not_started')
  const [savingTitle, setSavingTitle] = useState(false)
  const [titleSaved, setTitleSaved]   = useState(false)
  const [subKpis, setSubKpis] = useState<SubKPIIn[]>([])
  const [savingSubs, setSavingSubs] = useState(false)
  const [subsSaved, setSubsSaved]   = useState(false)

  const reload = () => fetchKPI(kpiId).then(data => {
    setKpi(data)
    setTitle(data.title)
    setKpiStatus(data.status)
    setSubKpis(data.sub_kpis.map(s => ({
      sub_id: s.sub_id,
      title: s.title,
      items: [...s.items].sort((a, b) => a.order_index - b.order_index).map(i => i.content),
    })))
  })

  useEffect(() => { reload() }, [kpiId])

  const saveTitle = async () => {
    setSavingTitle(true)
    try {
      await updateKPI(kpiId, { title, status: kpiStatus })
      setTitleSaved(true); setTimeout(() => setTitleSaved(false), 2000)
      onSaved()
    } finally { setSavingTitle(false) }
  }

  const saveSubs = async () => {
    setSavingSubs(true)
    try {
      await updateKPI(kpiId, { sub_kpis: subKpis })
      setSubsSaved(true); setTimeout(() => setSubsSaved(false), 2000)
      reload()
    } finally { setSavingSubs(false) }
  }

  const setSub = (i: number, patch: Partial<SubKPIIn>) =>
    setSubKpis(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))

  const setItem = (si: number, ii: number, val: string) =>
    setSub(si, { items: subKpis[si].items.map((x, j) => j === ii ? val : x) })

  const handleUpdateHighlight = (id: number, updated: HighlightItem) => {
    setKpi(prev => prev ? { ...prev, highlights: prev.highlights.map(x => x.id === id ? updated : x) } : prev)
  }

  const handleDeleteHighlight = async (id: number) => {
    await deleteHighlight(id)
    setKpi(prev => prev ? { ...prev, highlights: prev.highlights.filter(x => x.id !== id) } : prev)
  }

  const handleAddHighlight = async () => {
    const newItem = await addHighlight(kpiId)
    setKpi(prev => prev ? { ...prev, highlights: [...prev.highlights, newItem] } : prev)
  }

  if (!kpi) return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex justify-center">
      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* KPI title + status */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 space-y-2">
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
            {titleSaved ? '已存' : '儲存'}
          </button>
        </div>
        {/* KPI status selector */}
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setKpiStatus(opt.value)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                kpiStatus === opt.value
                  ? `${opt.badge} bg-white dark:bg-slate-900`
                  : 'border-transparent text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Sub KPI editor — 2/5 */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">KPI 指標</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSubKpis(s => [...s, { sub_id: '', title: '', items: [] }])}
                className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border
                  border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400
                  hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3 h-3" /> 新增
              </button>
              <button
                onClick={saveSubs}
                disabled={savingSubs}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold
                  bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
              >
                {savingSubs ? <Loader2 className="w-3 h-3 animate-spin" /> : subsSaved ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                {subsSaved ? '已存' : '儲存'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {subKpis.map((sub, si) => (
              <div key={si} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                {/* sub header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800">
                  <input
                    value={sub.sub_id}
                    onChange={e => setSub(si, { sub_id: e.target.value })}
                    placeholder="1.1"
                    className="w-14 text-sm px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700
                      bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200
                      focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                  />
                  <input
                    value={sub.title}
                    onChange={e => setSub(si, { title: e.target.value })}
                    placeholder="指標標題..."
                    className="flex-1 text-sm px-2 py-1 rounded border border-slate-200 dark:border-slate-700
                      bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200
                      focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setSubKpis(s => s.filter((_, i) => i !== si))}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* items */}
                <div className="p-2 space-y-1.5">
                  {sub.items.map((item, ii) => (
                    <div key={ii} className="flex items-center gap-1.5">
                      <input
                        value={item}
                        onChange={e => setItem(si, ii, e.target.value)}
                        placeholder="項目內容..."
                        className="flex-1 text-sm px-2 py-1 rounded border border-slate-200 dark:border-slate-700
                          bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
                          focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => setSub(si, { items: sub.items.filter((_, j) => j !== ii) })}
                        className="p-1 rounded text-slate-300 hover:text-rose-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setSub(si, { items: [...sub.items, ''] })}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> 新增項目
                  </button>
                </div>
              </div>
            ))}
            {subKpis.length === 0 && <p className="text-xs text-slate-400 italic">無指標</p>}
          </div>
        </div>

        {/* Highlights editor — 3/5 */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Highlight</span>
            </div>
            <button
              onClick={handleAddHighlight}
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
                key={h.id} item={h} kpiId={kpiId}
                onUpdate={updated => handleUpdateHighlight(h.id, updated)}
                onDelete={() => handleDeleteHighlight(h.id)}
              />
            ))}
            {kpi.highlights.length === 0 && <p className="text-xs text-slate-400 italic">無項目</p>}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Year week grid helpers ────────────────────────────────────────────────────

function getYearMondays(year: number): string[] {
  const jan1 = new Date(year, 0, 1)
  const dow = jan1.getDay()
  const daysToAdd = dow === 1 ? 0 : dow === 0 ? 1 : 8 - dow
  const cursor = new Date(year, 0, 1 + daysToAdd)
  const weeks: string[] = []
  while (cursor.getFullYear() === year) {
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')
    weeks.push(`${year}-${m}-${d}`)
    cursor.setDate(cursor.getDate() + 7)
  }
  return weeks
}

function todayMonday(): string {
  const t = new Date()
  const dow = t.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  const m = new Date(t); m.setDate(t.getDate() + diff)
  return `${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}-${String(m.getDate()).padStart(2,'0')}`
}

function WeekGrid({ yearWeeks, weekSet, selectedWeek, pendingCreate, creating, onSelect }: {
  yearWeeks: string[]
  weekSet: Set<string>
  selectedWeek: string
  pendingCreate: string | null
  creating: boolean
  onSelect: (date: string) => void
}) {
  const thisWeek = todayMonday()
  const quarters = [0,1,2,3].map(q => yearWeeks.slice(q*13, q*13+13))

  return (
    <div className="space-y-1">
      {quarters.map((qWeeks, qi) => (
        <div key={qi} className="grid gap-1 items-center"
          style={{ gridTemplateColumns: 'auto repeat(13, minmax(0,1fr))' }}>
          <span className="text-[9px] font-bold text-slate-400 w-4 text-center">Q{qi+1}</span>
          {qWeeks.map(date => {
            const hasData   = weekSet.has(date)
            const isSel     = date === selectedWeek
            const isPending = date === pendingCreate
            const isToday   = date === thisWeek
            const [,mm,dd]  = date.split('-')
            const label     = `${parseInt(mm)}/${parseInt(dd)}`

            return (
              <button
                key={date}
                onClick={() => onSelect(date)}
                disabled={creating}
                title={date}
                className={`
                  py-1 rounded text-[10px] font-medium leading-none transition-all truncate
                  ${isSel
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isPending
                      ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 ring-2 ring-sky-400'
                      : hasData
                        ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-300 dark:hover:bg-blue-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }
                  ${isToday && !isSel && !isPending ? 'ring-2 ring-sky-400' : ''}
                `}
              >
                {label}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── AdminPanel ────────────────────────────────────────────────────────────────

function AdminPanel() {
  const [weeks, setWeeks]               = useState<Week[]>([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [tabs, setTabs]                 = useState<KPIListItem[]>([])
  const [activeKpiId, setActiveKpiId]   = useState<number | null>(null)
  const [pendingCreate, setPendingCreate] = useState<string | null>(null)
  const [creating, setCreating]         = useState(false)
  const [year, setYear]                 = useState(new Date().getFullYear())

  const yearWeeks = getYearMondays(year)
  const weekSet   = new Set(weeks.map(w => w.week_date))

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

  const handleSelectWeek = (date: string) => {
    if (weekSet.has(date)) {
      setPendingCreate(null)
      setSelectedWeek(date)
    } else {
      setPendingCreate(date)
    }
  }

  const handleConfirmCreate = async () => {
    if (!pendingCreate) return
    setCreating(true)
    try {
      await createWeek(pendingCreate)
      await loadWeeks()
      setSelectedWeek(pendingCreate)
      setPendingCreate(null)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">Admin Panel</h2>

      {/* Year week grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">週份</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setYear(y => y - 1)}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 w-10 text-center">{year}</span>
              <button onClick={() => setYear(y => y + 1)}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-200 dark:bg-blue-800" />有資料</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-200 dark:bg-slate-700" />未建立</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm ring-1 ring-sky-400 bg-slate-200" />本週</span>
          </div>
        </div>
        <div className="px-4 py-3">
          <WeekGrid
            yearWeeks={yearWeeks}
            weekSet={weekSet}
            selectedWeek={selectedWeek}
            pendingCreate={pendingCreate}
            creating={creating}
            onSelect={handleSelectWeek}
          />
          {pendingCreate && (
            <div className="mt-3 flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <span className="text-xs text-amber-700 dark:text-amber-300 flex-1">
                建立 <strong>{pendingCreate}</strong> 週份並帶入上週內容？
              </span>
              <button
                onClick={handleConfirmCreate}
                disabled={creating}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
                  bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 transition-colors"
              >
                {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                確認建立
              </button>
              <button
                onClick={() => setPendingCreate(null)}
                className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI tab selector */}
      {selectedWeek && tabs.length > 0 && (
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
