import axios from 'axios'

export interface SubKPIItem { id: number; content: string; order_index: number }
export interface SubKPI { id: number; sub_id: string; title: string; items: SubKPIItem[] }

export interface HighlightItem {
  id: number; content: string; order_index: number; status: string
  llm_prompt: string | null; link: string | null
  image_path: string | null; video_path: string | null
}
export interface LowlightItem {
  id: number; content: string; order_index: number; status: string
  llm_prompt: string | null; link: string | null
  image_path: string | null; video_path: string | null
}

export interface KPI {
  id: number; number: number; title: string; status: string
  sub_kpis: SubKPI[]; highlights: HighlightItem[]; lowlights: LowlightItem[]
}
export interface KPIListItem { id: number; number: number; title: string; status: string }
export interface Week { id: number; week_date: string }
export interface TrendPoint { week_date: string; status: string }

export interface ItemUpdate {
  content?: string; status?: string; llm_prompt?: string; link?: string
}

const http = axios.create({ baseURL: '/api' })

export const fetchWeeks = () => http.get<Week[]>('/weeks').then(r => r.data)
export const fetchKPIsByWeek = (date: string) => http.get<KPIListItem[]>(`/weeks/${date}/kpis`).then(r => r.data)
export const fetchKPI = (id: number) => http.get<KPI>(`/kpis/${id}`).then(r => r.data)
export const fetchTrend = (number: number) => http.get<TrendPoint[]>(`/kpis/trend/${number}`).then(r => r.data)

// Admin — weeks
export const createWeek = (week_date: string) => http.post<Week>('/admin/weeks', { week_date }).then(r => r.data)

// Admin — KPI
export const updateKPI = (id: number, data: { title?: string }) =>
  http.put<KPI>(`/admin/kpis/${id}`, data).then(r => r.data)

// Admin — highlights
export const addHighlight = (kpiId: number) =>
  http.post<HighlightItem>(`/admin/kpis/${kpiId}/highlights`).then(r => r.data)
export const updateHighlight = (id: number, data: ItemUpdate) =>
  http.put<HighlightItem>(`/admin/highlights/${id}`, data).then(r => r.data)
export const deleteHighlight = (id: number) =>
  http.delete(`/admin/highlights/${id}`)
export const generateHighlight = (id: number, prompt: string, context?: string) =>
  http.post<HighlightItem>(`/admin/highlights/${id}/generate`, { prompt, context }).then(r => r.data)
export const uploadHighlightFile = (id: number, field: 'image_path' | 'video_path', file: File) => {
  const form = new FormData(); form.append('file', file)
  return http.post<{ url: string }>(`/admin/highlights/${id}/upload?field=${field}`, form).then(r => r.data)
}

// Admin — lowlights
export const addLowlight = (kpiId: number) =>
  http.post<LowlightItem>(`/admin/kpis/${kpiId}/lowlights`).then(r => r.data)
export const updateLowlight = (id: number, data: ItemUpdate) =>
  http.put<LowlightItem>(`/admin/lowlights/${id}`, data).then(r => r.data)
export const deleteLowlight = (id: number) =>
  http.delete(`/admin/lowlights/${id}`)
export const generateLowlight = (id: number, prompt: string, context?: string) =>
  http.post<LowlightItem>(`/admin/lowlights/${id}/generate`, { prompt, context }).then(r => r.data)
export const uploadLowlightFile = (id: number, field: 'image_path' | 'video_path', file: File) => {
  const form = new FormData(); form.append('file', file)
  return http.post<{ url: string }>(`/admin/lowlights/${id}/upload?field=${field}`, form).then(r => r.data)
}
