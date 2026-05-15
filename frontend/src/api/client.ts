import axios from 'axios'

export interface SubKPI {
  id: string
  title: string
  items: string[]
}

export interface KPI {
  id: number
  title: string
  sub_kpis: SubKPI[]
  highlights: string[]
  lowlights: string[]
  status: string
}

export interface KPIListItem {
  id: number
  title: string
  status: string
}

const http = axios.create({ baseURL: '/api' })

export const fetchKPIList = () =>
  http.get<KPIListItem[]>('/kpis').then((r) => r.data)

export const fetchKPI = (id: number) =>
  http.get<KPI>(`/kpis/${id}`).then((r) => r.data)
