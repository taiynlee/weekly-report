import { useMemo } from 'react'
import { Download } from 'lucide-react'
import type { AnnualPlanKpi, Segment } from '../api/client'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface Props { data: AnnualPlanKpi[]; year: number }

export const KPI_COLORS: Record<number, string> = {
  1: '#22d3ee',
  2: '#38bdf8',
  3: '#60a5fa',
  4: '#818cf8',
  5: '#a78bfa',
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function isLeapYear(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

function getDayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1)
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000) + 1
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getMonthOffsets(year: number) {
  const total = isLeapYear(year) ? 366 : 365
  return Array.from({ length: 12 }, (_, m) => {
    const first = new Date(year, m, 1)
    const days  = new Date(year, m + 1, 0).getDate()
    return {
      month: m,
      label: MONTH_LABELS[m],
      left:  ((getDayOfYear(first) - 1) / total) * 100,
      width: (days / total) * 100,
    }
  })
}

function getSegmentBar(seg: Segment, year: number) {
  if (!seg.start_date || !seg.end_date) return null
  const total     = isLeapYear(year) ? 366 : 365
  const yearStart = new Date(year, 0, 1)
  const yearEnd   = new Date(year, 11, 31)
  const start     = parseLocalDate(seg.start_date)
  const end       = parseLocalDate(seg.end_date)
  const cs = start < yearStart ? yearStart : start
  const ce = end   > yearEnd   ? yearEnd   : end
  const sd = getDayOfYear(cs)
  const ed = getDayOfYear(ce)
  return {
    left:  ((sd - 1) / total) * 100,
    width: ((ed - sd + 1) / total) * 100,
  }
}

function getTodayPct(year: number): number | null {
  const today = new Date()
  if (today.getFullYear() !== year) return null
  const total = isLeapYear(year) ? 366 : 365
  return ((getDayOfYear(today) - 1) / total) * 100
}

function GridLines({ months }: { months: ReturnType<typeof getMonthOffsets> }) {
  return (
    <>
      {months.map(m => (
        <div key={m.month}
          className="absolute top-0 h-full border-r border-slate-100 dark:border-slate-700/40 last:border-r-0"
          style={{ left: `${m.left + m.width}%` }}
        />
      ))}
    </>
  )
}

// Column widths
const KPI_W  = 'w-32 flex-shrink-0'
const TASK_W = 'w-48 flex-shrink-0'
const PCT_W  = 'w-14 flex-shrink-0'
const BORDER = 'border-r border-slate-200 dark:border-slate-700'

export function GanttChart({ data, year }: Props) {
  const months   = useMemo(() => getMonthOffsets(year), [year])
  const todayPct = useMemo(() => getTodayPct(year), [year])

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex justify-end">
        <a
          href={`${API_BASE}/api/export/annual-plan/${year}/pptx`}
          download={`annual-plan-${year}.pptx`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
            bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
            text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          匯出 PPT
        </a>
      </div>

    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-[11px]">

      {/* Month header */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <div className={`${KPI_W} ${BORDER} px-2 py-1 bg-slate-50 dark:bg-slate-800
          flex items-center text-[9px] font-bold uppercase tracking-widest text-slate-400`}>KPI</div>
        <div className={`${TASK_W} ${BORDER} px-2 py-1 bg-slate-50 dark:bg-slate-800
          flex items-center text-[9px] font-bold uppercase tracking-widest text-slate-400`}>Task</div>
        <div className="flex-1 relative h-7 bg-slate-50 dark:bg-slate-800">
          {months.map(m => (
            <div key={m.month}
              className="absolute top-0 h-full flex items-center justify-center
                text-[10px] font-bold text-slate-500 dark:text-slate-400
                border-r border-slate-200 dark:border-slate-700 last:border-r-0"
              style={{ left: `${m.left}%`, width: `${m.width}%` }}>
              {m.label}
            </div>
          ))}
          {todayPct !== null && (
            <div className="absolute top-0 h-full z-10"
              style={{ left: `${todayPct}%`, transform: 'translateX(-50%)' }}>
              <div className="w-0.5 h-full bg-red-500" />
            </div>
          )}
        </div>
        <div className={`${PCT_W} ${BORDER} px-2 py-1 bg-slate-50 dark:bg-slate-800
          flex items-center justify-center text-[9px] font-bold text-slate-400`}>工量%</div>
      </div>

      {/* KPI groups */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {data.map(group => {
          const color = KPI_COLORS[group.kpi_number] ?? '#60a5fa'
          const visibleTasks = group.tasks
            .map(t => ({ ...t, datedItems: t.items.filter(i => i.segments.length > 0) }))
            .filter(t => t.datedItems.length > 0)

          return (
            <div key={group.kpi_number}>
              {/* KPI group header */}
              <div className="flex items-stretch">
                <div className={`${KPI_W} px-2 py-1 flex items-center ${BORDER}
                  bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-700 dark:text-slate-300`}
                  style={{ borderLeft: `3px solid ${color}` }}>
                  <span className="leading-tight break-words min-w-0">{group.kpi_title.replace(/^\d+\.\s*/, '')}</span>
                </div>
                <div className={`${TASK_W} ${BORDER} bg-slate-50 dark:bg-slate-800/60`} />
                <div className="flex-1 relative h-6 bg-slate-50/50 dark:bg-slate-800/20">
                  <GridLines months={months} />
                  {todayPct !== null && (
                    <div className="absolute top-0 h-full w-0.5 bg-red-500/40 z-10"
                      style={{ left: `${todayPct}%`, transform: 'translateX(-50%)' }} />
                  )}
                </div>
                <div className={`${PCT_W} ${BORDER} bg-slate-50 dark:bg-slate-800/60
                  flex items-center justify-center font-bold`}
                  style={{ color }}>
                  {group.percentage != null ? `${group.percentage}%` : ''}
                </div>
              </div>

              {/* Tasks with dated items only */}
              {visibleTasks.length === 0 ? (
                <div className="flex">
                  <div className={`${KPI_W} ${BORDER}`} style={{ borderLeft: `3px solid ${color}` }} />
                  <div className={`${TASK_W} ${BORDER} px-2 py-1`}>
                    <span className="text-slate-300 dark:text-slate-600 italic">—</span>
                  </div>
                  <div className="flex-1" />
                  <div className={`${PCT_W} ${BORDER}`} />
                </div>
              ) : (
                visibleTasks.map(task => (
                  <div key={task.id}>
                    {/* Task header — full text, wraps if needed */}
                    <div className="flex items-stretch">
                      <div className={`${KPI_W} ${BORDER}`} style={{ borderLeft: `3px solid ${color}` }} />
                      <div className={`${TASK_W} ${BORDER} px-2 py-0.5
                        font-semibold text-slate-600 dark:text-slate-300
                        bg-slate-50/50 dark:bg-slate-800/30 flex items-center`}>
                        <span className="leading-tight break-words min-w-0">{task.title}</span>
                      </div>
                      <div className="flex-1 relative min-h-[22px] bg-slate-50/20 dark:bg-slate-800/10">
                        <GridLines months={months} />
                        {todayPct !== null && (
                          <div className="absolute top-0 h-full w-px bg-red-400/20 z-10"
                            style={{ left: `${todayPct}%` }} />
                        )}
                      </div>
                      <div className={`${PCT_W} ${BORDER} bg-slate-50/20 dark:bg-slate-800/10`} />
                    </div>

                    {/* Item rows — one bar per segment */}
                    {task.datedItems.map(item => {
                      const bars = item.segments
                        .map(seg => ({ seg, bar: getSegmentBar(seg, year) }))
                        .filter(x => x.bar !== null)
                      return (
                        <div key={item.id} className="flex items-stretch">
                          <div className={`${KPI_W} ${BORDER}`} style={{ borderLeft: `3px solid ${color}` }} />
                          <div className={`${TASK_W} ${BORDER}`} />
                          <div className="flex-1 relative min-h-[22px] py-0.5">
                            <GridLines months={months} />
                            {todayPct !== null && (
                              <div className="absolute top-0 h-full w-px bg-red-400/20 z-10"
                                style={{ left: `${todayPct}%` }} />
                            )}
                            {bars.map(({ seg, bar }, bi) => (
                              <div
                                key={seg.id}
                                title={`${item.content}  ${seg.start_date} – ${seg.end_date}`}
                                className="absolute top-0.5 bottom-0.5 rounded z-20 flex items-center px-1.5 overflow-hidden"
                                style={{
                                  left: `${bar!.left}%`,
                                  width: `${Math.max(bar!.width, 0.3)}%`,
                                  backgroundColor: color,
                                  opacity: 0.82,
                                  minWidth: '6px',
                                }}
                              >
                                {bi === 0 && (
                                  <span className="text-white text-[10px] font-medium whitespace-nowrap overflow-hidden text-ellipsis leading-none select-none">
                                    {item.content}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className={`${PCT_W} ${BORDER}`} />
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
    </div>
  )
}
