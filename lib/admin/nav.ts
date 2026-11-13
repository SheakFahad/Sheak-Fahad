/** Admin navigation. `ready: false` items are shown as "Soon" (not links) until their manager ships. */
export interface AdminNavItem {
  href: string
  label: string
  group: 'Overview' | 'Site' | 'Portfolio' | 'Inbox' | 'System'
  ready: boolean
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard', group: 'Overview', ready: true },
  { href: '/admin/homepage', label: 'Homepage', group: 'Site', ready: false },
  { href: '/admin/pages', label: 'Pages', group: 'Site', ready: false },
  { href: '/admin/sections', label: 'Sections', group: 'Site', ready: false },
  { href: '/admin/navigation', label: 'Navigation', group: 'Site', ready: false },
  { href: '/admin/media', label: 'Media Library', group: 'Site', ready: false },
  { href: '/admin/projects', label: 'Projects', group: 'Portfolio', ready: false },
  { href: '/admin/experience', label: 'Experience', group: 'Portfolio', ready: false },
  { href: '/admin/education', label: 'Education', group: 'Portfolio', ready: false },
  { href: '/admin/research', label: 'Research', group: 'Portfolio', ready: false },
  { href: '/admin/videos', label: 'Videos', group: 'Portfolio', ready: false },
  { href: '/admin/skills', label: 'Skills', group: 'Portfolio', ready: false },
  { href: '/admin/achievements', label: 'Achievements', group: 'Portfolio', ready: false },
  { href: '/admin/travel', label: 'Travel', group: 'Portfolio', ready: false },
  { href: '/admin/memories', label: 'Memories', group: 'Portfolio', ready: false },
  { href: '/admin/hobbies', label: 'Hobbies', group: 'Portfolio', ready: false },
  { href: '/admin/messages', label: 'Messages', group: 'Inbox', ready: false },
  { href: '/admin/ai-assistant', label: 'AI Assistant', group: 'System', ready: false },
  { href: '/admin/settings', label: 'Settings', group: 'System', ready: false },
  { href: '/admin/users', label: 'Users', group: 'System', ready: false },
  { href: '/admin/security', label: 'Security', group: 'System', ready: false },
  { href: '/admin/activity-logs', label: 'Activity Logs', group: 'System', ready: false },
]
