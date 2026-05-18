import { useState, useRef } from 'react'
import { Target, Star, ChevronRight, Link2, ImageIcon, VideoIcon, X, FileText, Copy, Check, ZoomIn, ZoomOut } from 'lucide-react'
import type { KPI, HighlightItem } from '../api/client'

interface Props { kpi: KPI }

const STATUS = {
  completed:   { label: '已完成', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
  in_progress: { label: '進行中', dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  not_started: { label: '未開始', dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
}

function MiniPie({ percentage, size = 36 }: { percentage: number; size?: number }) {
  const sw   = size <= 36 ? 4 : 5
  const r    = (size - sw * 2) / 2
  const cx   = size / 2
  const circ = 2 * Math.PI * r
  const pct  = Math.min(Math.max(percentage, 0), 100)
  const offset = circ * (1 - pct / 100)

  const color = pct <= 33.3
    ? { stroke: '#ef4444', text: 'text-rose-500 dark:text-rose-400' }
    : pct <= 66.6
    ? { stroke: '#f59e0b', text: 'text-amber-500 dark:text-amber-400' }
    : { stroke: '#10b981', text: 'text-emerald-500 dark:text-emerald-400' }

  const fs = size <= 36 ? '8px' : size <= 48 ? '10px' : '12px'

  return (
    <div className="flex-shrink-0 relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e2e8f0" strokeWidth={sw}
          className="dark:stroke-slate-700" />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color.stroke} strokeWidth={sw}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-bold ${color.text}`}
        style={{ fontSize: fs }}>
        {pct}%
      </span>
    </div>
  )
}

function toPlainText(highlights: HighlightItem[]): string {
  return highlights.map((h, i) => {
    let line = `${i + 1}. ${h.content}`
    if (h.percentage != null) line += ` (${h.percentage}%)`
    return line
  }).join('\n')
}

function ExportModal({ highlights, onClose }: { highlights: HighlightItem[]; onClose: () => void }) {
  const text = toPlainText(highlights)
  const [copied, setCopied] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">匯出 Highlight</span>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          <textarea
            ref={taRef}
            readOnly
            value={text}
            rows={Math.min(highlights.length * 2 + 1, 16)}
            className="w-full text-sm font-mono px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700
              bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={e => (e.target as HTMLTextAreaElement).select()}
          />
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已複製' : '複製'}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold
              border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300
              hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  )
}

function MediaModal({ type, src, onClose }: { type: 'image' | 'video'; src: string; onClose: () => void }) {
  const [scale, setScale]     = useState(1)
  const [fittedW, setFittedW] = useState<number | null>(null)
  const zoom = (delta: number) => setScale(s => Math.min(5, Math.max(0.25, +(s + delta).toFixed(2))))

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: nw, naturalHeight: nh } = e.currentTarget
    const maxW = window.innerWidth  * 0.9
    const maxH = window.innerHeight * 0.85
    setFittedW(Math.min(nw, maxW, maxH * nw / nh))
  }

  const imgWidth = fittedW != null ? fittedW * scale : undefined

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      {/* toolbar */}
      <div className="flex items-center justify-end gap-3 px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-1 bg-white/10 rounded-lg px-1.5 py-1">
          <button onClick={() => zoom(-0.1)} title="縮小"
            className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-white/70 text-xs w-10 text-center select-none">{Math.round(scale * 100)}%</span>
          <button onClick={() => zoom(0.1)} title="放大"
            className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        <button onClick={onClose}
          className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm">
          <X className="w-4 h-4" /> 關閉
        </button>
      </div>

      {/* scrollable content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4" onClick={onClose}>
        <div onClick={e => e.stopPropagation()} className="flex-shrink-0">
          {type === 'image'
            ? <img
                src={src}
                onLoad={onImgLoad}
                className="h-auto rounded-xl block transition-all duration-150"
                style={{ width: imgWidth }}
              />
            : <video src={src} controls autoPlay className="rounded-xl transition-all duration-150"
                style={{ width: `${scale * 90}vw` }} />
          }
        </div>
      </div>
    </div>
  )
}

export function KpiDetail({ kpi }: Props) {
  const [modal, setModal] = useState<{ type: 'image' | 'video'; src: string } | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const s = STATUS[kpi.status as keyof typeof STATUS] ?? STATUS.not_started

  const pctItems = kpi.highlights.filter(h => h.percentage != null)
  const avgPct   = pctItems.length > 0
    ? Math.round(pctItems.reduce((sum, h) => sum + h.percentage!, 0) / pctItems.length)
    : null

  return (
    <div className="space-y-4">
      {modal && <MediaModal type={modal.type} src={modal.src} onClose={() => setModal(null)} />}
      {exportOpen && <ExportModal highlights={kpi.highlights} onClose={() => setExportOpen(false)} />}

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>

      {/* Main grid: sub KPIs left, highlights right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Sub KPIs — 2/5 */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">KPI 指標</span>
            {avgPct != null && (
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">平均</span>
                <MiniPie percentage={avgPct} size={44} />
              </div>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {kpi.sub_kpis.map(sub => (
              <div key={sub.id} className="px-4 py-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  {sub.sub_id && (
                    <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {sub.sub_id}
                    </span>
                  )}
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{sub.title}</p>
                </div>
                <ul className="space-y-1">
                  {sub.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <ChevronRight className="w-3 h-3 mt-0.5 text-blue-400 flex-shrink-0" />
                      <span>{item.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {kpi.sub_kpis.length === 0 && (
              <p className="px-4 py-2.5 text-xs text-slate-400 italic">尚無指標</p>
            )}
          </div>
        </div>

        {/* Highlights — 3/5 */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Highlight</span>
            <div className="ml-auto h-11 flex items-center">
              <button
                onClick={() => setExportOpen(true)}
                title="匯出純文字"
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {kpi.highlights.map((h, i) => (
              <li key={h.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0 text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug whitespace-pre-wrap">{h.content}</span>

                {/* 連/圖/影 icons */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {h.media.filter(m => m.media_type === 'link').map(m => (
                    <a
                      key={m.id}
                      href={m.url} target="_blank" rel="noreferrer"
                      title="開啟連結"
                      className="p-1 rounded text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </a>
                  ))}
                  {h.media.filter(m => m.media_type === 'image').map(m => (
                    <button
                      key={m.id}
                      onClick={() => setModal({ type: 'image', src: m.url })}
                      title="查看圖片"
                      className="p-1 rounded text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                  {h.media.filter(m => m.media_type === 'video').map(m => (
                    <button
                      key={m.id}
                      onClick={() => setModal({ type: 'video', src: m.url })}
                      title="播放影片"
                      className="p-1 rounded text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors"
                    >
                      <VideoIcon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>

                {h.percentage != null && (
                  <MiniPie percentage={h.percentage} />
                )}
              </li>
            ))}
            {kpi.highlights.length === 0 && (
              <li className="px-4 py-3 text-xs text-slate-400 italic">無</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
