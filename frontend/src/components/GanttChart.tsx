import { useMemo } from 'react'
import type { ScheduleByKpi, ScheduleTask } from '../api/client'

interface Props { data: ScheduleByKpi[]; year: number }

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

function getTaskBar(task: ScheduleTask, year: number) {
  const total     = isLeapYear(year) ? 366 : 365
  const yearStart = new Date(year, 0, 1)
  const yearEnd   = new Date(year, 11, 31)
  const start     = new Date(task.start_date)
  const end       = new Date(task.end_date)
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
        <div
          key={m.month}
          className="absolute top-0 h-full border-r border-slate-100 dark:border-slate-700/40 last:border-r-0"
          style={{ left: `${m.left + m.width}%` }}
        />
      ))}
    </>
  )
}

// Fixed column widths
const KPI_W  = 'w-24 flex-shrink-0'   // 96 px  — KPI group name
const TASK_W = 'w-44 flex-shrink-0'   // 176 px — task name
const BORDER = 'border-r border-slate-200 dark:border-slate-700'

export function GanttChart({ data, year }: Props) {
  const months   = useMemo(() => getMonthOffsets(year), [year])
  const todayPct = useMemo(() => getTodayPct(year), [year])

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

      {/* Month header */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {/* KPI col header */}
        <div className={`${KPI_W} ${BORDER} px-2 py-1.5 bg-slate-50 dark:bg-slate-800
          flex items-center text-[9px] font-bold uppercase tracking-widest text-slate-400`}>
          KPI
        </div>
        {/* Task col header */}
        <div className={`${TASK_W} ${BORDER} px-2 py-1.5 bg-slate-50 dark:bg-slate-800
          flex items-center text-[9px] font-bold uppercase tracking-widest text-slate-400`}>
          Task
        </div>
        {/* Timeline month labels */}
        <div className="flex-1 relative h-8 bg-slate-50 dark:bg-slate-800">
          {months.map(m => (
            <div
              key={m.month}
              className="absolute top-0 h-full flex items-center justify-center
                text-[10px] font-bold text-slate-500 dark:text-slate-400
                border-r border-slate-200 dark:border-slate-700 last:border-r-0"
              style={{ left: `${m.left}%`, width: `${m.width}%` }}
            >
              {m.label}
            </div>
          ))}
          {todayPct !== null && (
            <div className="absolute top-0 h-full z-10 flex flex-col items-center"
              style={{ left: `${todayPct}%`, transform: 'translateX(-50%)' }}>
              <div className="w-0.5 h-full bg-red-500" />
            </div>
          )}
        </div>
      </div>

      {/* KPI groups */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {data.map(group => {
          const color = KPI_COLORS[group.kpi_number] ?? '#60a5fa'
          return (
            <div key={group.kpi_number}>

              {/* Group header — KPI name spans both label cols */}
              <div className="flex items-stretch">
                <div
                  className={`${KPI_W} px-2 py-2 flex items-center ${BORDER}
                    bg-slate-50 dark:bg-slate-800/60
                    text-[11px] font-bold text-slate-700 dark:text-slate-300`}
                  style={{ borderLeft: `3px solid ${color}` }}
                >
                  <span className="truncate leading-tight">
                    {group.kpi_title.replace(/^\d+\.\s*/, '')}
                  </span>
                </div>
                <div className={`${TASK_W} ${BORDER} bg-slate-50 dark:bg-slate-800/60`} />
                <div className="flex-1 relative h-8 bg-slate-50/50 dark:bg-slate-800/20">
                  <GridLines months={months} />
                  {todayPct !== null && (
                    <div className="absolute top-0 h-full w-0.5 bg-red-500/50 z-10"
                      style={{ left: `${todayPct}%`, transform: 'translateX(-50%)' }} />
                  )}
                </div>
              </div>

              {/* Tasks */}
              {group.tasks.length === 0 ? (
                <div className="flex">
                  <div className={`${KPI_W} ${BORDER}`}
                    style={{ borderLeft: `3px solid ${color}` }} />
                  <div className={`${TASK_W} ${BORDER} px-2 py-2`}>
                    <span className="text-[11px] text-slate-400 italic">尚無排程任務</span>
                  </div>
                  <div className="flex-1 py-2" />
                </div>
              ) : (
                group.tasks.map(task => {
                  const { left, width } = getTaskBar(task, year)
                  const barColor = task.color ?? color
                  return (
                    <div key={task.id} className="flex items-stretch">
                      {/* KPI col — empty, keeps the color accent */}
                      <div className={`${KPI_W} ${BORDER}`}
                        style={{ borderLeft: `3px solid ${color}` }} />
                      {/* Task name col */}
                      <div className={`${TASK_W} ${BORDER} px-2 py-1.5
                        text-[11px] text-slate-600 dark:text-slate-400 flex items-center`}>
                        <span className="truncate">{task.title}</span>
                      </div>
                      {/* Timeline */}
                      <div className="flex-1 relative min-h-[30px] py-1">
                        <GridLines months={months} />
                        {todayPct !== null && (
                          <div className="absolute top-0 h-full w-px bg-red-400/30 z-10"
                            style={{ left: `${todayPct}%` }} />
                        )}
                        <div
                          title={`${task.title}  ${task.start_date} – ${task.end_date}`}
                          className="absolute top-1 bottom-1 rounded-md z-20"
                          style={{
                            left: `${left}%`,
                            width: `${Math.max(width, 0.3)}%`,
                            backgroundColor: barColor,
                            minWidth: '6px',
                          }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
