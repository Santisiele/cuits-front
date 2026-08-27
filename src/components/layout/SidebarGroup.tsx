import { NavLink } from "react-router-dom"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  path: string
  label: string
}

export interface NavGroup {
  label: string
  icon: LucideIcon
  items: NavItem[]
}

interface SidebarGroupProps {
  group: NavGroup
  /** Called after a link is followed, so the drawer can close itself. */
  onNavigate: () => void
}

/**
 * One labelled section of the navigation drawer.
 *
 * The active item is highlighted here rather than in the header: with the
 * drawer closed there is nothing on screen naming the current view, so this
 * is the only place that answers "where am I".
 */
export function SidebarGroup({ group, onNavigate }: SidebarGroupProps) {
  const Icon = group.icon

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
        <Icon className="w-4 h-4 shrink-0" />
        {group.label}
      </div>

      {group.items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            `rounded-md px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}
