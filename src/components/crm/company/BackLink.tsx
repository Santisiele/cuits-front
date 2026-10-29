import { Link, useLocation } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

export function BackLink() {
  const fromAgenda = (useLocation().state as { from?: string } | null)?.from === "agenda"
  return (
    <Link
      to={fromAgenda ? "/crm/agenda" : "/crm"}
      className="text-sm inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="w-4 h-4" /> {fromAgenda ? "Agenda" : "Empresas"}
    </Link>
  )
}
