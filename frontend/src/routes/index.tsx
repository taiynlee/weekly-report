import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { fetchKPIList, fetchKPI, type KPIListItem, type KPI } from '../api/client'
import { KpiDetail } from '../components/KpiDetail'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const [tabs, setTabs] = useState<KPIListItem[]>([])
  const [activeId, setActiveId] = useState<number>(1)
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchKPIList().then((list) => {
      setTabs(list)
      if (list.length > 0) setActiveId(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (!activeId) return
    setLoading(true)
    fetchKPI(activeId)
      .then(setKpi)
      .finally(() => setLoading(false))
  }, [activeId])

  const shortTitle = (title: string) => title.split('(')[0].trim()

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1.5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveId(tab.id)}
            className={`flex-1 min-w-0 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${activeId === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
          >
            {shortTitle(tab.title)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-64">
        {loading && (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        )}
        {!loading && kpi && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{kpi.title}</h2>
            <KpiDetail kpi={kpi} />
          </>
        )}
      </div>
    </div>
  )
}
