import { useEffect, useState } from 'react'
import { fetchTrend, type TrendPoint } from '../api/client'

interface Props { kpiNumber: number }

const STATUS_CONFIG = {
  completed:   { color: 'bg-emerald-500', border: 'border-emerald-500', label: '已完成', text: 'text-emerald-600 dark:text-emerald-400' },
  in_progress: { color: 'bg-blue-500',    border: 'border-blue-500',    label: '進行中', text: 'text-blue-600 dark:text-blue-400' },
  not_started: { color: 'bg-slate-300 dark:bg-slate-600', border: 'border-slate-300 dark:border-slate-600', label: '未開始', text: 'text-slate-400' },
}

const LINE_COLOR: Record<string, string> = {
  completed:   'bg-emerald-400',
  in_progress: 'bg-blue-400',
  not_started: 'bg-slate-300 dark:bg-slate-600',
}

export function TrendChart({ kpiNumber }: Props) {
  const [points, setPoints] = useState<TrendPoint[]>([])

  useEffect(() => {
    fetchTrend(kpiNumber).then(setPoints)
  }, [kpiNumber])

  if (points.length < 1) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Status Trend
        </span>
      </div>

      {points.length === 1 ? (
        <p className="px-4 py-3 text-xs text-slate-400 italic">需要至少 2 週資料才能顯示趨勢</p>
      ) : (
        <div className="px-4 py-4 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max">
            {points.map((pt, i) => {
              const cfg = STATUS_CONFIG[pt.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.not_started
              const nextCfg = points[i + 1]
                ? (STATUS_CONFIG[points[i + 1].status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.not_started)
                : null
              return (
                <div key={pt.week_date} className="flex items-center">
                  {/* Node */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-4 h-4 rounded-full border-2 ${cfg.color} ${cfg.border} shadow-sm`} />
                    <span className={`text-[10px] font-semibold ${cfg.text} whitespace-nowrap`}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{pt.week_date}</span>
                  </div>
                  {/* Connector line */}
                  {nextCfg && (
                    <div className={`h-0.5 w-16 mx-1 rounded-full ${LINE_COLOR[pt.status] ?? LINE_COLOR.not_started}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
