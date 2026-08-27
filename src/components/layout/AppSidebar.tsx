import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Search, Database, Settings } from "lucide-react"
import { SidebarGroup } from "./SidebarGroup"
import type { NavGroup } from "./SidebarGroup"

// ─── Navigation ───────────────────────────────────────────────────────────────

/** Routes offered in the drawer, grouped by what the user is trying to do. */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Búsqueda",
    icon: Search,
    items: [
      { path: "/search", label: "Buscar CUIT" },
      { path: "/path", label: "Buscar relación", hidden: true },
    ],
  },
  {
    label: "Mi base",
    icon: Database,
    items: [
      { path: "/base", label: "Mi base", hidden: true },
      { path: "/full-base", label: "Full base" },
      { path: "/to-know", label: "Por conocer", hidden: true },
      { path: "/companies", label: "Empresas a buscar" },
      { path: "/crossing-over", label: "Coincidencias" },
      { path: "/birthdays", label: "Cumpleaños" },
    ],
  },
  {
    label: "Administración",
    icon: Settings,
    items: [
      { path: "/add", label: "Manejar relación" },
      { path: "/edit", label: "Editar persona" },
      { path: "/sources", label: "Fuentes" },
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Left-side navigation drawer, replacing the horizontal tab bar.
 *
 * Open state is local and deliberately not persisted: a drawer that reopens
 * itself on every reload would cover the content the user came back for.
 */
export function AppSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0" aria-label="Abrir menú">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        /**
         * The width classes carry the same data-[side=left] prefix the base
         * component uses. Without it the base w-3/4 wins on selector
         * specificity and these are silently ignored.
         */
        className="data-[side=left]:w-[85vw] data-[side=left]:sm:w-80 data-[side=left]:sm:max-w-none overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Navegación</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-6 px-2 pb-6">
          {NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.label} group={group} onNavigate={() => setOpen(false)} />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
