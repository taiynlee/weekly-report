import { CheckCircle, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'
import type { KPI } from '../api/client'

interface Props {
  kpi: KPI
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  in_progress: { label: '進行中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  not_started: { label: '未開始', color: 'bg-gray-100 text-gray-600' },
}

export function KpiDetail({ kpi }: Props) {
  const status = STATUS_LABEL[kpi.status] ?? STATUS_LABEL.not_started

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Sub KPIs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">KPI 指標</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {kpi.sub_kpis.map((sub) => (
            <div key={sub.id} className="px-5 py-4">
              <p className="font-semibold text-gray-800 mb-2">{sub.title}</p>
              <ul className="space-y-1">
                {sub.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Highlights */}
        <div className="bg-white rounded-xl border border-green-200 overflow-hidden">
          <div className="px-5 py-3 bg-green-50 border-b border-green-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide">Highlight</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {kpi.highlights.map((h, i) => (
              <li key={i} className="px-5 py-3 flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Lowlights */}
        <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
          <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide">Lowlight</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {kpi.lowlights.map((l, i) => (
              <li key={i} className="px-5 py-3 text-sm text-gray-500 italic">
                {l}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
