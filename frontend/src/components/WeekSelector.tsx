import { ChevronDown } from 'lucide-react'
import type { Week } from '../api/client'

interface Props {
  weeks: Week[]
  value: string
  onChange: (date: string) => void
}

export function WeekSelector({ weeks, value, onChange }: Props) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-1.5 rounded-md text-sm font-medium
          bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
          text-slate-700 dark:text-slate-200 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {weeks.map(w => (
          <option key={w.id} value={w.week_date}>
            Week of {w.week_date}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-2 w-4 h-4 text-slate-400" />
    </div>
  )
}
