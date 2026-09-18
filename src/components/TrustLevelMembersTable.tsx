import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ColumnFilter } from "@/components/ColumnFilter"
import { useTrustLevelMembers, useTrustLevelsQuery } from "@/hooks/useTrustLevels"
import { useStore } from "@/store/useStore"
import { exportNodes } from "@/lib/exportTable"
import { optionsFrom, passesFilter } from "@/lib/columnFilters"
import { parseLevelParam, paletteFor } from "@/lib/trustLevels"
import { cn } from "@/lib/utils"
import type { TrustLevelMember } from "@/types"

const MEMBER_COLUMNS = [
  { key: "taxId" as const, label: "CUIT" },
  { key: "businessName" as const, label: "Nombre" },
  { key: "sources" as const, label: "Fuentes" },
  { key: "trustReason" as const, label: "Motivo" },
  { key: "relationshipCount" as const, label: "Relaciones" },
]

const NO_REASON = "Sin motivo"

function sourcesOf(member: TrustLevelMember): string[] {
  return member.sources
}

function reasonOf(member: TrustLevelMember): string[] {
  return [member.trustReason]
}
const UNNAMED_TITLE = "Nivel de confianza"

function fileNameFor(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug ? `nivel-${slug}` : "nivel"
}

function matches(member: TrustLevelMember, search: string): boolean {
  if (!search) return true
  const needle = search.toLowerCase()
  return (
    member.businessName.toLowerCase().includes(needle) ||
    member.taxId.includes(search.replace(/\D/g, "") || search)
  )
}

function BackLink() {
  return (
    <Link
      to="/trust-levels"
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
    >
      <ArrowLeft className="w-3 h-3" />
      Niveles de confianza
    </Link>
  )
}

export function TrustLevelMembersTable() {
  const { value: rawValue } = useParams()
  const value = parseLevelParam(rawValue)
  const query = useTrustLevelMembers(value)
  const { data: knownLevels } = useTrustLevelsQuery()
  const { setEditTaxId } = useStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [hiddenSources, setHiddenSources] = useState<string[]>([])
  const [hiddenReasons, setHiddenReasons] = useState<string[]>([])

  function openNode(taxId: string): void {
    setEditTaxId(taxId)
    void navigate("/edit")
  }

  if (value === null) {
    return (
      <Card>
        <CardHeader className="space-y-2">
          <BackLink />
          <CardTitle>Nivel inválido</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">
            Esa dirección no corresponde a ningún nivel. Elegí uno desde la lista de niveles.
          </p>
        </CardContent>
      </Card>
    )
  }

  const level = query.data?.level ?? knownLevels?.find((known) => known.value === value)
  const members = query.data?.members ?? []
  const hiddenSourceSet = new Set(hiddenSources)
  const hiddenReasonSet = new Set(hiddenReasons)
  const filtered = members.filter(
    (member) =>
      matches(member, search) &&
      passesFilter(sourcesOf(member), hiddenSourceSet) &&
      passesFilter(reasonOf(member), hiddenReasonSet)
  )
  const narrowed = search.length > 0 || hiddenSources.length > 0 || hiddenReasons.length > 0
  const sourceOptions = optionsFrom(members, sourcesOf)
  const reasonOptions = optionsFrom(members, reasonOf, { emptyLabel: NO_REASON })
  const sourceFilter = (appearance: "header" | "button") => (
    <ColumnFilter label="Fuentes" appearance={appearance} options={sourceOptions} hidden={hiddenSources} onChange={setHiddenSources} />
  )
  const reasonFilter = (appearance: "header" | "button") => (
    <ColumnFilter label="Motivo" appearance={appearance} options={reasonOptions} hidden={hiddenReasons} onChange={setHiddenReasons} />
  )
  const palette = paletteFor(level?.color)
  const error = query.error ? (query.error as Error).message : null

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="shrink-0 space-y-2">
        <BackLink />
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-3">
              {level && <span className={cn("h-4 w-4 shrink-0", palette.swatch)} />}
              <CardTitle>
                {level ? level.label : UNNAMED_TITLE}
                {query.data && (narrowed ? ` (${filtered.length} de ${members.length})` : ` (${members.length})`)}
              </CardTitle>
            </div>
            {level?.description && (
              <p className="text-sm text-muted-foreground">{level.description}</p>
            )}
          </div>
          {level && members.length > 0 && (
            <div className="flex gap-2 items-center flex-wrap">
              <Input
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o CUIT..."
                className="w-full sm:w-64"
              />
              <div className="flex gap-2 sm:hidden">
                {sourceFilter("button")}
                {reasonFilter("button")}
              </div>
              <Button variant="outline" size="sm" onClick={() => exportNodes(filtered, MEMBER_COLUMNS, fileNameFor(level.label), "csv")}>CSV</Button>
              <Button variant="outline" size="sm" onClick={() => exportNodes(filtered, MEMBER_COLUMNS, fileNameFor(level.label), "xlsx")}>XLSX</Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-auto">
        {error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : query.isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : members.length === 0 ? (
          <p className="text-muted-foreground text-sm">Ningún CUIT tiene este nivel todavía.</p>
        ) : (
          <>
            <table className="hidden sm:table w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border">
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">CUIT</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Nombre</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">{sourceFilter("header")}</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">{reasonFilter("header")}</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Relaciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr key={member.taxId} className={cn("border-b border-border transition-colors", palette.row)}>
                    <td className="py-2 px-3 font-mono text-xs text-center">
                      <button
                        onClick={() => openNode(member.taxId)}
                        className="cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                      >
                        {member.taxId}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => openNode(member.taxId)}
                        className="cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                      >
                        {member.businessName || "—"}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex gap-1 flex-wrap justify-center">
                        {member.sources.length > 0
                          ? member.sources.map((s) => (
                              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                            ))
                          : "—"}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={member.trustReason ? "" : "text-muted-foreground italic"}>
                        {member.trustReason || NO_REASON}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-muted-foreground">{member.relationshipCount}</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      Ningún CUIT de este nivel coincide con la búsqueda o los filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="sm:hidden divide-y divide-border">
              {filtered.map((member) => (
                <div key={member.taxId} className={cn("py-3 px-1 transition-colors", palette.row)}>
                  <button
                    onClick={() => openNode(member.taxId)}
                    className="font-mono text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors mb-1"
                  >
                    {member.taxId}
                  </button>
                  <button
                    onClick={() => openNode(member.taxId)}
                    className="text-sm font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors block"
                  >
                    {member.businessName || "—"}
                  </button>
                  <p className={cn("text-xs mt-1", member.trustReason ? "" : "text-muted-foreground italic")}>
                    {member.trustReason || NO_REASON}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {member.sources.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                    <span className="text-xs text-muted-foreground">{member.relationshipCount} relaciones</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-4 text-center text-muted-foreground text-sm">
                  Ningún CUIT de este nivel coincide con la búsqueda o los filtros
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
