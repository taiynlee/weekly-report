import axios from 'axios'

export interface SubKPIItem { id: number; content: string; order_index: number }
export interface SubKPI { id: number; sub_id: string; title: string; items: SubKPIItem[] }

export interface HighlightMedia { id: number; media_type: 'image' | 'video' | 'link'; url: string; order_index: number }

export interface HighlightItem {
  id: number; content: string; order_index: number; status: string
  llm_prompt: string | null; percentage: number | null; media: HighlightMedia[]
}

export interface KPI {
  id: number; number: number; title: string; status: string
  sub_kpis: SubKPI[]; highlights: HighlightItem[]
}
export interface KPIListItem { id: number; number: number; title: string; status: string }
export interface Week { id: number; week_date: string }
export interface TrendPoint { week_date: string; status: string }

export interface ItemUpdate {
  content?: string; status?: string; llm_prompt?: string; percentage?: number
}

const http = axios.create({ baseURL: '/api' })

export const fetchWeeks        = () => http.get<Week[]>('/weeks').then(r => r.data)
export const fetchKPIsByWeek   = (date: string) => http.get<KPIListItem[]>(`/weeks/${date}/kpis`).then(r => r.data)
export const fetchKPI          = (id: number) => http.get<KPI>(`/kpis/${id}`).then(r => r.data)
export const fetchTrend        = (number: number) => http.get<TrendPoint[]>(`/kpis/trend/${number}`).then(r => r.data)
export const createWeek        = (week_date: string) => http.post<Week>('/admin/weeks', { week_date }).then(r => r.data)
export interface SubKPIIn { sub_id: string; title: string; items: string[] }
export const updateKPI         = (id: number, data: { title?: string; status?: string; sub_kpis?: SubKPIIn[] }) => http.put<KPI>(`/admin/kpis/${id}`, data).then(r => r.data)

export const addHighlight      = (kpiId: number) => http.post<HighlightItem>(`/admin/kpis/${kpiId}/highlights`).then(r => r.data)
export const updateHighlight   = (id: number, data: ItemUpdate) => http.put<HighlightItem>(`/admin/highlights/${id}`, data).then(r => r.data)
export const deleteHighlight   = (id: number) => http.delete(`/admin/highlights/${id}`)
export const generateHighlight = (id: number, prompt: string, context?: string) =>
  http.post<HighlightItem>(`/admin/highlights/${id}/generate`, { prompt, context }).then(r => r.data)
export const uploadHighlightFile = (id: number, field: 'image' | 'video', file: File) => {
  const form = new FormData(); form.append('file', file)
  return http.post<HighlightItem>(`/admin/highlights/${id}/upload?field=${field}`, form).then(r => r.data)
}
export const addHighlightLink    = (id: number, url: string) =>
  http.post<HighlightItem>(`/admin/highlights/${id}/links`, { url }).then(r => r.data)
export const deleteHighlightMedia = (mediaId: number) => http.delete(`/admin/highlight-media/${mediaId}`)

// ── Schedule ─────────────────────────────────────────────────────────────────
export interface ScheduleTask {
  id: number; year: number; kpi_number: number
  title: string; start_date: string; end_date: string
  color: string | null; order_index: number
}
export interface ScheduleByKpi {
  kpi_number: number; kpi_title: string; tasks: ScheduleTask[]
}
export interface ScheduleTaskCreate {
  year: number; kpi_number: number; title: string
  start_date: string; end_date: string; color?: string; order_index?: number
}
export interface ScheduleTaskUpdate {
  title?: string; start_date?: string; end_date?: string; color?: string; order_index?: number
}

export const fetchSchedule       = (year: number) => http.get<ScheduleByKpi[]>(`/schedule/${year}`).then(r => r.data)
export const fetchScheduleYears  = () => http.get<number[]>('/schedule/years').then(r => r.data)
export const createScheduleTask  = (data: ScheduleTaskCreate) => http.post<ScheduleTask>('/admin/schedule', data).then(r => r.data)
export const updateScheduleTask  = (id: number, data: ScheduleTaskUpdate) => http.put<ScheduleTask>(`/admin/schedule/${id}`, data).then(r => r.data)
export const deleteScheduleTask  = (id: number) => http.delete(`/admin/schedule/${id}`)
export const copyScheduleYear    = (from_year: number, to_year: number) =>
  http.post('/admin/schedule/copy-year', { from_year, to_year }).then(r => r.data)
