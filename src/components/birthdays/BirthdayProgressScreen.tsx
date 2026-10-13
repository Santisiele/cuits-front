import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ColumnFilter } from "@/components/ColumnFilter"
import { useBirthdayProgress } from "@/hooks/useBirthdayProgress"
import { useStore } from "@/store/useStore"
import { getErrorMessage } from "@/lib/errors"
import { optionsFrom, passesFilter } from "@/lib/columnFilters"
import {
  formatCount,
  formatMissedOn,
  lastUpdateText,
  matchesPerson,
  missingText,
  peopleWithBirthdayText,
  progressPercent,
  sweepText,
} from "@/lib/birthdayProgress"
import type { BirthdayMiss, BirthdayPending, BirthdaySourceProgress } from "@/types"

const LINK = "cursor-pointer text-left hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
const HEAD = "py-2 px-3 text-muted-foreground font-medium"

function ProgressBar({ label, part, total }: { label: string; part: number; total: number }) {
  const percent = progressPercent(part, total)
  return (
    <div
      className="h-3 w-full bg-muted"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
    </div>
  )
}

function SourcesTable({ sources }: { sources: BirthdaySourceProgress[] }) {
  if (sources.length === 0) return <p className="text-muted-foreground text-sm">No hay fuentes con personas conocidas.</p>
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border">
          <th className={`text-left ${HEAD}`}>Fuente</th>
          <th className={`text-right ${HEAD}`}>Personas</th>
          <th className={`text-right ${HEAD}`}>Con cumpleaños</th>
          <th className={`text-right ${HEAD}`}>Faltan</th>
        </tr>
      </thead>
      <tbody>
        {sources.map((row) => (
          <tr key={row.source} className="border-b border-border last:border-0">
            <td className="py-2 px-3">{row.source}</td>
            <td className="py-2 px-3 text-right tabular-nums">{formatCount(row.people)}</td>
            <td className="py-2 px-3 text-right tabular-nums">{formatCount(row.withBirthday)}</td>
            <td className="py-2 px-3 text-right tabular-nums">{formatCount(row.missing)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function PersonCells({ taxId, businessName, onOpen }: { taxId: string; businessName: string; onOpen: (taxId: string) => void }) {
  return (
    <>
      <td className="py-2 px-3">
        <button type="button" onClick={() => onOpen(taxId)} className={LINK}>
          {businessName || "—"}
        </button>
      </td>
      <td className="py-2 px-3 font-mono text-xs">
        <button type="button" onClick={() => onOpen(taxId)} className={LINK}>
          {taxId}
        </button>
      </td>
    </>
  )
}

function PendingList({ pending, onOpen }: { pending: BirthdayPending[]; onOpen: (taxId: string) => void }) {
  const [search, setSearch] = useState("")
  const [hiddenSources, setHiddenSources] = useState<string[]>([])
  const hidden = new Set(hiddenSources)
  const shown = pending.filter((person) => matchesPerson(person, search) && passesFilter(person.sources, hidden))
  const sourceOptions = optionsFrom(pending, (person) => person.sources)
  const narrowed = search.trim() !== "" || hiddenSources.length > 0
  const count = narrowed ? `${formatCount(shown.length)} de ${formatCount(pending.length)}` : formatCount(pending.length)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <CardTitle>Pendientes ({count})</CardTitle>
          {pending.length > 0 && (
            <Input
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o CUIT..."
              className="w-full sm:w-64"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {pending.length === 0 ? (
          <p className="text-muted-foreground text-sm">No queda nadie pendiente.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={`text-left ${HEAD}`}>Nombre</th>
                <th className={`text-left ${HEAD}`}>CUIT</th>
                <th className={`text-left ${HEAD}`}>
                  <ColumnFilter label="Fuentes" options={sourceOptions} hidden={hiddenSources} onChange={setHiddenSources} />
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((person) => (
                <tr key={person.taxId} className="border-b border-border last:border-0">
                  <PersonCells taxId={person.taxId} businessName={person.businessName} onOpen={onOpen} />
                  <td className="py-2 px-3">
                    <div className="flex gap-1 flex-wrap">
                      {person.sources.map((source) => (
                        <Badge key={source} variant="outline" className="text-xs">{source}</Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-muted-foreground">
                    Nadie coincide con la búsqueda o los filtros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}

function MissesList({ misses, onOpen }: { misses: BirthdayMiss[]; onOpen: (taxId: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No encontrados en Nosis ({formatCount(misses.length)})</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {misses.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nosis encontró a todos los que se consultaron.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={`text-left ${HEAD}`}>Nombre</th>
                <th className={`text-left ${HEAD}`}>CUIT</th>
                <th className={`text-left ${HEAD}`}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {misses.map((miss) => (
                <tr key={miss.taxId} className="border-b border-border last:border-0">
                  <PersonCells taxId={miss.taxId} businessName={miss.businessName} onOpen={onOpen} />
                  <td className="py-2 px-3 whitespace-nowrap">{formatMissedOn(miss.missedOn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}

function Message({ children, error = false }: { children: string; error?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga de cumpleaños</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={error ? "text-destructive text-sm" : "text-muted-foreground text-sm"}>{children}</p>
      </CardContent>
    </Card>
  )
}

export function BirthdayProgressScreen() {
  const query = useBirthdayProgress()
  const { setEditTaxId } = useStore()
  const navigate = useNavigate()

  function openNode(taxId: string): void {
    setEditTaxId(taxId)
    void navigate("/edit")
  }

  if (query.isLoading) return <Message>Cargando...</Message>
  if (query.error || !query.data) {
    return <Message error>{getErrorMessage(query.error, "Error al cargar el progreso")}</Message>
  }

  const progress = query.data
  const { sweep } = progress

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Carga de cumpleaños</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm font-medium">{peopleWithBirthdayText(progress.withBirthday, progress.knownPeople)}</p>
          <ProgressBar label="Personas con cumpleaños" part={progress.withBirthday} total={progress.knownPeople} />
          <p className="text-xs text-muted-foreground">{missingText(progress.missing)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Barrido de hoy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm font-medium">{sweepText(sweep.consultedToday, sweep.dailyLimit)}</p>
          <ProgressBar label="Consultas de hoy" part={sweep.consultedToday} total={sweep.dailyLimit} />
          <p className="text-xs text-muted-foreground">{lastUpdateText(sweep.updatedAt)}</p>
          <p className="text-xs text-muted-foreground">El barrido corre en tu máquina con pnpm scrape:birthdays</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Por fuente</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <SourcesTable sources={progress.bySource} />
        </CardContent>
      </Card>

      <PendingList pending={progress.pending} onOpen={openNode} />
      <MissesList misses={progress.misses} onOpen={openNode} />
    </div>
  )
}
