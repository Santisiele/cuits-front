import { useEffect } from "react"
import { useCrmResponsibles } from "@/hooks/useCrm"
import { useAuthStore } from "@/store/useAuthStore"
import { ownResponsible } from "@/lib/crm"
import { NativeSelect } from "./CrmFields"

export function ResponsibleSelect({ id, value, onChange }: { id: string; value: string; onChange: (name: string) => void }) {
  const responsibles = useCrmResponsibles()
  const me = useAuthStore((state) => state.username)
  const list = responsibles.data ?? []
  const own = ownResponsible(list, me)
  const active = list.filter((responsible) => !responsible.disabled)
  const options = value && !active.some((responsible) => responsible.name.toLowerCase() === value.toLowerCase())
    ? [value, ...active.map((responsible) => responsible.name)]
    : active.map((responsible) => responsible.name)

  useEffect(() => {
    if (value === "" && own) onChange(own)
  }, [value, own, onChange])

  return (
    <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{responsibles.isLoading ? "Cargando..." : "Elegí quién"}</option>
      {options.map((name) => (
        <option key={name} value={name}>{name}</option>
      ))}
    </NativeSelect>
  )
}
