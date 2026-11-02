import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCrmSources } from "@/hooks/useCrm"
import { SOURCE_CATEGORY_LABELS, optionalNameError, type OriginDraft } from "@/lib/crm"
import { Field, NativeSelect } from "./CrmFields"

export function OriginField({ id, draft, onChange }: { id: string; draft: OriginDraft; onChange: (draft: OriginDraft) => void }) {
  const sources = useCrmSources()
  const categories = [...new Set((sources.data ?? []).map((source) => source.category))]

  return (
    <Field
      id={id}
      label="Origen"
      error={draft.mode === "text" ? optionalNameError(draft.text) : null}
      hint={draft.mode === "source" ? "La empresa entra a esa fuente. Si después cambiás el origen, sale." : undefined}
    >
      <div className="flex gap-2 mb-1.5">
        {(["text", "source"] as const).map((mode) => (
          <Button
            key={mode}
            type="button"
            size="sm"
            variant={draft.mode === mode ? "default" : "outline"}
            aria-pressed={draft.mode === mode}
            onClick={() => onChange({ ...draft, mode })}
          >
            {mode === "text" ? "Texto" : "Una de nuestras fuentes"}
          </Button>
        ))}
      </div>
      {draft.mode === "text" ? (
        <Input id={id} value={draft.text} onChange={(e) => onChange({ ...draft, text: e.target.value })} placeholder="Ej: Amigo de Luchi" />
      ) : (
        <NativeSelect id={id} value={draft.source} onChange={(e) => onChange({ ...draft, source: e.target.value })}>
          <option value="">{sources.isLoading ? "Cargando..." : "Sin fuente"}</option>
          {categories.map((category) => (
            <optgroup key={category} label={SOURCE_CATEGORY_LABELS[category] ?? category}>
              {(sources.data ?? [])
                .filter((source) => source.category === category)
                .map((source) => (
                  <option key={source.name} value={source.name}>{source.name}</option>
                ))}
            </optgroup>
          ))}
        </NativeSelect>
      )}
    </Field>
  )
}
