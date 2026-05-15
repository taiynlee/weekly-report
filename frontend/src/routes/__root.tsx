import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-2 h-8 bg-blue-600 rounded-full" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">2026 KPI Dashboard</h1>
            <p className="text-sm text-gray-500">Weekly Report — 2026/05/11</p>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  ),
})
