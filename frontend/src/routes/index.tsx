import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { fetchWeeks, fetchKPIsByWeek, fetchKPI, type Week, type KPIListItem, type KPI } from '../api/client'
import { WeekSelector } from '../components/WeekSelector'
import { KpiDetail } from '../components/KpiDetail'
import { TrendChart } from '../components/TrendChart'

export const Route = createFileRoute('/')({ component: Dashboard })

const STATUS_BAR = {
  completed:   'bg-emerald-500',
  in_progress: 'bg-blue-500',
  not_started: 'bg-slate-300 dark:bg-slate-600',
}

function Dashboard() {
  const [weeks, setWeeks]         = useState<Week[]>([])
  const [selectedWeek, setSelectedWeek] = useState<string>('')
  const [tabs, setTabs]           = useState<KPIListItem[]>([])
  const [activeId, setActiveId]   = useState<number>(0)
  const [kpi, setKpi]             = useState<KPI | null>(null)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingKpi, setLoadingKpi]   = useState(false)

  // load weeks
  useEffect(() => {
    fetchWeeks().then(list => {
      setWeeks(list)
      if (list.length > 0) setSelectedWeek(list[0].week_date)
    })
  }, [])

  // load KPI list when week changes
  useEffect(() => {
    if (!selectedWeek) return
    setLoadingList(true)
    fetchKPIsByWeek(selectedWeek)
      .then(list => { setTabs(list); if (list.length > 0) setActiveId(list[0].id) })
      .finally(() => setLoadingList(false))
  }, [selectedWeek])

  // load KPI detail when tab changes
  useEffect(() => {
    if (!activeId) return
    setLoadingKpi(true)
    fetchKPI(activeId).then(setKpi).finally(() => setLoadingKpi(false))
  }, [activeId])

  const shortTitle = (title: string) => title.replace(/^\d+\.\s*/, '').split('(')[0].trim()
  const tabNumber  = (title: string) => title.match(/^(\d+)\./)?.[1] ?? ''

  return (
    <div className="space-y-4">
      {/* Sub-header: week selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          2026 KPI Dashboard
        </h2>
        <WeekSelector weeks={weeks} value={selectedWeek} onChange={setSelectedWeek} />
      </div>

      {/* Tab bar */}
      {!loadingList && tabs.length > 0 && (
        <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {tabs.map(tab => {
            const active = tab.id === activeId
            const barColor = STATUS_BAR[tab.status as keyof typeof STATUS_BAR] ?? STATUS_BAR.not_started
            return (
              <button
                key={tab.id}
                onClick={() => setActiveId(tab.id)}
                className={`relative flex-1 min-w-0 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left group ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="block text-[10px] font-bold opacity-60 mb-0.5">{tabNumber(tab.title)}</span>
                <span className="block truncate">{shortTitle(tab.title)}</span>
                {/* status bar at bottom */}
                <span className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${active ? 'bg-white/40' : barColor}`} />
              </button>
            )
          })}
        </div>
      )}

      {/* KPI content */}
      <div className="min-h-96">
        {(loadingList || loadingKpi) && (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        )}

        {!loadingList && !loadingKpi && kpi && (
          <>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-3">{kpi.title}</h3>
            <KpiDetail kpi={kpi} />
            <div className="mt-4">
              <TrendChart kpiNumber={kpi.number} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
