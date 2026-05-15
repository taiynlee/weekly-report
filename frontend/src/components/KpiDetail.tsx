import { CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react'
import type { KPI } from '../api/client'

interface Props { kpi: KPI }

const STATUS = {
  completed:   { label: '已完成', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
  in_progress: { label: '進行中', dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  not_started: { label: '未開始', dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
}

export function KpiDetail({ kpi }: Props) {
  const s = STATUS[kpi.status as keyof typeof STATUS] ?? STATUS.not_started

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>

      {/* Main grid: metrics left, highlights/lowlights right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Sub KPIs — 2/5 width */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">KPI 指標</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {kpi.sub_kpis.map(sub => (
              <div key={sub.id} className="px-4 py-3">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{sub.sub_id}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{sub.title}</p>
                <ul className="space-y-1">
                  {sub.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <ChevronRight className="w-3 h-3 mt-0.5 text-blue-400 flex-shrink-0" />
                      <span>{item.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {kpi.sub_kpis.length === 0 && (
              <p className="px-4 py-3 text-xs text-slate-400 italic">尚無指標</p>
            )}
          </div>
        </div>

        {/* Highlights + Lowlights — 3/5 width */}
        <div className="lg:col-span-3 grid grid-rows-[1fr_auto] gap-4">
          {/* Highlights */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Highlight</span>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {kpi.highlights.map((h, i) => (
                <li key={h.id} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{h.content}</span>
                </li>
              ))}
              {kpi.highlights.length === 0 && (
                <li className="px-4 py-3 text-xs text-slate-400 italic">無</li>
              )}
            </ul>
          </div>

          {/* Lowlights */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Lowlight</span>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {kpi.lowlights.map((l, i) => (
                <li key={l.id} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{l.content}</span>
                </li>
              ))}
              {kpi.lowlights.length === 0 && (
                <li className="px-4 py-3 text-xs text-slate-400 italic">無</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
