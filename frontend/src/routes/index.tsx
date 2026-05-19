import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Loader2, CalendarDays } from 'lucide-react'
import {
  fetchWeeks, fetchKPIsByWeek, fetchKPI, fetchAnnualPlan,
  type Week, type KPIListItem, type KPI, type AnnualPlanKpi,
} from '../api/client'
import { WeekSelector } from '../components/WeekSelector'
import { KpiDetail } from '../components/KpiDetail'
import { GanttChart } from '../components/GanttChart'

export const Route = createFileRoute('/')({ component: Dashboard })

const STATUS_BAR = {
  completed:   'bg-emerald-500',
  in_progress: 'bg-blue-500',
  not_started: 'bg-slate-300 dark:bg-slate-600',
}

function Dashboard() {
  const year = new Date().getFullYear()

  const [weeks, setWeeks]               = useState<Week[]>([])
  const [selectedWeek, setSelectedWeek] = useState<string>('')
  const [tabs, setTabs]                 = useState<KPIListItem[]>([])
  const [activeTab, setActiveTab]       = useState<'schedule' | number>('schedule')
  const [kpi, setKpi]                   = useState<KPI | null>(null)
  const [annualPlanData, setAnnualPlanData] = useState<AnnualPlanKpi[]>([])
  const [annualPlanYear, setAnnualPlanYear] = useState<number>(year)
  const [loadingList, setLoadingList]   = useState(false)
  const [loadingKpi, setLoadingKpi]     = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(false)

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
      .then(list => {
        setTabs(list)
        if (list.length > 0 && activeTab !== 'schedule') setActiveTab(list[0].id)
      })
      .finally(() => setLoadingList(false))
  }, [selectedWeek])

  // load KPI detail when a KPI tab is active
  useEffect(() => {
    if (activeTab === 'schedule' || !activeTab) return
    setLoadingKpi(true)
    fetchKPI(activeTab as number).then(setKpi).finally(() => setLoadingKpi(false))
  }, [activeTab])

  // load annual plan when schedule tab is active; fall back to prior year if no data
  useEffect(() => {
    if (activeTab !== 'schedule') return
    setLoadingSchedule(true)
    fetchAnnualPlan(year).then(async data => {
      if (data.length === 0) {
        const prev = await fetchAnnualPlan(year - 1)
        setAnnualPlanData(prev)
        setAnnualPlanYear(prev.length > 0 ? year - 1 : year)
      } else {
        setAnnualPlanData(data)
        setAnnualPlanYear(year)
      }
    }).finally(() => setLoadingSchedule(false))
  }, [activeTab])

  const shortTitle = (title: string) => title.replace(/^\d+\.\s*/, '').split('(')[0].trim()
  const tabNumber  = (title: string) => title.match(/^(\d+)\./)?.[1] ?? ''

  return (
    <div className="space-y-4">
      {/* Sub-header: week selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          {year} KPI Dashboard
        </h2>
        <WeekSelector weeks={weeks} value={selectedWeek} onChange={setSelectedWeek} />
      </div>

      {/* Tab bar */}
      {!loadingList && (
        <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {/* Schedule tab — leftmost */}
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap overflow-hidden ${
              activeTab === 'schedule'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
            年度計劃
          </button>

          {/* KPI tabs */}
          {tabs.map(tab => {
            const active   = tab.id === activeTab
            const barColor = STATUS_BAR[tab.status as keyof typeof STATUS_BAR] ?? STATUS_BAR.not_started
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 min-w-0 px-3 py-2.5 rounded-lg font-medium transition-all text-left whitespace-nowrap overflow-hidden ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-[10px] font-bold opacity-60 mr-1">{tabNumber(tab.title)}</span>
                <span className="text-[11px]">{shortTitle(tab.title)}</span>
                <span className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${active ? 'bg-white/40' : barColor}`} />
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      <div className="min-h-96">
        {activeTab === 'schedule' ? (
          loadingSchedule
            ? <div className="flex items-center justify-center h-48">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            : <GanttChart data={annualPlanData} year={annualPlanYear} />
        ) : (
          <>
            {(loadingList || loadingKpi) && (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            )}
            {!loadingList && !loadingKpi && kpi && (
              <KpiDetail kpi={kpi} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
