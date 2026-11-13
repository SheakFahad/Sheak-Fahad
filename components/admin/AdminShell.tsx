'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { signOut } from '@/app/admin/login/actions'
import { SFMark } from '@/components/layout/SFMark'
import { ADMIN_NAV, type AdminNavItem } from '@/lib/admin/nav'
import { cn } from '@/lib/utils/cn'

const GROUPS: AdminNavItem['group'][] = ['Overview', 'Site', 'Portfolio', 'Inbox', 'System']

/** Calm, fast admin chrome: no 3D, no heavy motion. */
export function AdminShell({ name, role, unread, children }: { name: string; role: string; unread: number; children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore a per-browser UI preference
      setCollapsed(localStorage.getItem('admin-sidebar') === 'collapsed')
    } catch {}
  }, [])
  useEffect(() => {
    setDrawer(false) // eslint-disable-line react-hooks/set-state-in-effect -- close the drawer after navigating
  }, [pathname])

  const current = ADMIN_NAV.find(i => (i.href === '/admin' ? pathname === '/admin' : pathname.startsWith(i.href)))
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? ADMIN_NAV.filter(i => i.ready && i.label.toLowerCase().includes(q)).slice(0, 6) : []
  }, [query])

  const toggle = () => {
    setCollapsed(c => {
      try {
        localStorage.setItem('admin-sidebar', c ? 'open' : 'collapsed')
      } catch {}
      return !c
    })
  }

  const nav = (
    <nav aria-label="Admin" className="grid gap-5">
      {GROUPS.map(group => (
        <div key={group}>
          {!collapsed && <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.18em] text-[var(--text-2)] uppercase">{group}</p>}
          <ul className="grid gap-0.5">
            {ADMIN_NAV.filter(i => i.group === group).map(item => {
              const active = current?.href === item.href
              const short = item.label.slice(0, 2)
              return (
                <li key={item.href}>
                  {item.ready ? (
                    <Link href={item.href} aria-current={active ? 'page' : undefined} title={collapsed ? item.label : undefined} className={cn('admin-nav-link', active && 'is-active')}>
                      <span className="admin-nav-link__dot" aria-hidden="true">
                        {short}
                      </span>
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  ) : (
                    <span className="admin-nav-link is-soon" aria-disabled="true" title={`${item.label} — coming soon`}>
                      <span className="admin-nav-link__dot" aria-hidden="true">
                        {short}
                      </span>
                      {!collapsed && (
                        <>
                          <span>{item.label}</span>
                          <span className="ml-auto text-[9px] tracking-wider uppercase">Soon</span>
                        </>
                      )}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="admin-app">
      {/* Desktop sidebar */}
      <aside className={cn('admin-sidebar', collapsed && 'is-collapsed')}>
        <div className="flex items-center gap-2.5 px-3 pb-5">
          <SFMark className="size-8 shrink-0" />
          {!collapsed && <span className="text-sm font-bold tracking-wide">SF Admin</span>}
        </div>
        <div className="flex-1 overflow-y-auto pr-1">{nav}</div>
        <button type="button" onClick={toggle} className="admin-btn mt-4 w-full justify-center text-xs" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? '»' : '« Collapse'}
        </button>
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="admin-drawer" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="admin-drawer__panel">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold">SF Admin</span>
              <button type="button" onClick={() => setDrawer(false)} className="admin-btn" aria-label="Close menu">
                ×
              </button>
            </div>
            {nav}
          </div>
          <button type="button" className="flex-1" aria-label="Close menu" onClick={() => setDrawer(false)} />
        </div>
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" onClick={() => setDrawer(true)} className="admin-btn lg:hidden" aria-label="Open menu">
            ☰
          </button>
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex items-center gap-2 truncate text-sm">
              <li>
                <Link href="/admin" className="text-[var(--text-2)] hover:text-[var(--text)]">
                  Admin
                </Link>
              </li>
              {current && current.href !== '/admin' && (
                <>
                  <li aria-hidden="true" className="text-[var(--text-2)]">
                    /
                  </li>
                  <li aria-current="page" className="truncate font-semibold">
                    {current.label}
                  </li>
                </>
              )}
            </ol>
          </nav>

          <div className="relative ml-auto hidden w-64 md:block">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && results[0]) {
                  router.push(results[0].href)
                  setQuery('')
                }
              }}
              placeholder="Search admin…"
              aria-label="Search admin"
              className="admin-input !py-2 text-sm"
            />
            {results.length > 0 && (
              <ul className="admin-card absolute top-full right-0 left-0 z-20 mt-1 grid p-1">
                {results.map(r => (
                  <li key={r.href}>
                    <Link href={r.href} onClick={() => setQuery('')} className="block rounded-md px-3 py-2 text-sm hover:bg-[var(--line)]">
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <span className="admin-pill" title="Unread messages" aria-label={`${unread} unread messages`}>
            ✉ {unread}
          </span>
          <div className="hidden text-right sm:block">
            <p className="text-sm leading-tight font-semibold">{name}</p>
            <p className="text-[11px] text-[var(--text-2)] capitalize">{role}</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="admin-btn">
              Log out
            </button>
          </form>
        </header>
        <main id="admin-content" className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}
