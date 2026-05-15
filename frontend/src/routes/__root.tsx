import { createRootRoute, Outlet, Link, useLocation } from '@tanstack/react-router'
import { Sun, Moon, Settings } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

function Layout() {
  const { dark, toggle } = useTheme()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left: brand + nav */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 items-end h-5">
                {[3,5,4,6,5].map((h,i) => (
                  <div key={i} className="w-1 bg-blue-500 dark:bg-blue-400 rounded-sm" style={{ height: `${h * 3}px` }} />
                ))}
              </div>
              <span className="font-bold text-sm tracking-wide text-slate-800 dark:text-slate-100">
                WEEKLY REPORT
              </span>
            </div>

            <nav className="flex items-center gap-1 text-sm">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  !isAdmin
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  isAdmin
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                Admin
              </Link>
            </nav>
          </div>

          {/* Right: theme toggle */}
          <button
            onClick={toggle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
              border border-slate-200 dark:border-slate-700
              bg-slate-50 dark:bg-slate-800
              text-slate-600 dark:text-slate-300
              hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-5">
        <Outlet />
      </main>
    </div>
  )
}

export const Route = createRootRoute({ component: Layout })
