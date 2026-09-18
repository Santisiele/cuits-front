import { ColumnFilter, type ColumnFilterAppearance } from "@/components/ColumnFilter"
import { useTrustLevelsQuery } from "@/hooks/useTrustLevels"
import { NO_LEVEL_LABEL, NO_LEVEL_VALUE, paletteFor } from "@/lib/trustLevels"
import type { FilterOption } from "@/lib/columnFilters"

interface TrustLevelFilterProps {
  hidden: number[]
  onChange: (hidden: number[]) => void
  appearance?: ColumnFilterAppearance
}

export function TrustLevelFilter({ hidden, onChange, appearance = "button" }: TrustLevelFilterProps) {
  const { data: levels = [] } = useTrustLevelsQuery()

  const options: FilterOption[] = [
    { value: String(NO_LEVEL_VALUE), label: NO_LEVEL_LABEL },
    ...levels.map((level) => ({
      value: String(level.value),
      label: level.label,
      swatch: paletteFor(level.color).swatch,
    })),
  ]

  return (
    <ColumnFilter
      label="Niveles"
      appearance={appearance}
      options={options}
      hidden={hidden.map(String)}
      onChange={(next) => onChange(next.map(Number))}
    />
  )
}
