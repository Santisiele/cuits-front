import { useState } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { matchCompanies } from "@/lib/crm"
import { formatTaxId } from "@/lib/cuit"
import type { CrmCompany } from "@/types"

export function CompanyPicker({
  id,
  companies,
  value,
  onChange,
}: {
  id: string
  companies: readonly CrmCompany[]
  value: string
  onChange: (taxId: string) => void
}) {
  const [search, setSearch] = useState("")
  const chosen = companies.find((company) => company.taxId === value)
  const matches = matchCompanies(companies, search)

  if (chosen) {
    return (
      <div className="flex items-center justify-between gap-2 border border-input px-3 py-2 text-sm">
        <span className="min-w-0 truncate">
          {chosen.businessName || "—"} <span className="text-muted-foreground font-mono text-xs">{formatTaxId(chosen.taxId)}</span>
        </span>
        <button type="button" aria-label="Cambiar empresa" onClick={() => onChange("")} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Input
        id={id}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Escribí el nombre o el CUIT"
        autoComplete="off"
        autoFocus
      />
      {search.trim() !== "" && (
        <div role="listbox" aria-label="Empresas encontradas" className="max-h-56 overflow-y-auto border border-border">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Ninguna empresa coincide</p>
          ) : (
            matches.map((company) => (
              <button
                key={company.taxId}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onChange(company.taxId)
                  setSearch("")
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent/50"
              >
                <span className="truncate">{company.businessName || "—"}</span>
                <span className="text-muted-foreground font-mono text-xs shrink-0">{formatTaxId(company.taxId)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
