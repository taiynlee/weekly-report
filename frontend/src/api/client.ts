import axios from 'axios'

export interface SubKPIItem { id: number; content: string; order_index: number }
export interface SubKPI { id: number; sub_id: string; title: string; items: SubKPIItem[] }
export interface Highlight { id: number; content: string; order_index: number }
export interface Lowlight { id: number; content: string; order_index: number }

export interface KPI {
  id: number; number: number; title: string; status: string
  sub_kpis: SubKPI[]; highlights: Highlight[]; lowlights: Lowlight[]
}
export interface KPIListItem { id: number; number: number; title: string; status: string }
export interface Week { id: number; week_date: string }
export interface TrendPoint { week_date: string; status: string }

export interface KPIUpdate {
  title?: string; status?: string
  highlights?: string[]; lowlights?: string[]
  sub_kpis?: { sub_id: string; title: string; items: string[] }[]
}

const http = axios.create({ baseURL: '/api' })

export const fetchWeeks = () => http.get<Week[]>('/weeks').then(r => r.data)
export const fetchKPIsByWeek = (date: string) => http.get<KPIListItem[]>(`/weeks/${date}/kpis`).then(r => r.data)
export const fetchKPI = (id: number) => http.get<KPI>(`/kpis/${id}`).then(r => r.data)
export const fetchTrend = (number: number) => http.get<TrendPoint[]>(`/kpis/trend/${number}`).then(r => r.data)
export const createWeek = (week_date: string) => http.post<Week>('/admin/weeks', { week_date }).then(r => r.data)
export const updateKPI = (id: number, data: KPIUpdate) => http.put<KPI>(`/admin/kpis/${id}`, data).then(r => r.data)
