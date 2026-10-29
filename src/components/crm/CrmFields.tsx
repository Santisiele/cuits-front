import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string | null; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}

export function NativeSelect({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn("h-9 w-full border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring", className)}
    />
  )
}

export function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex items-start gap-2 text-sm cursor-pointer">
      <input type="checkbox" className="mt-0.5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  )
}

export function DialogButtons({ onCancel, busy, submitLabel, busyLabel, disabled }: {
  onCancel: () => void
  busy: boolean
  submitLabel: string
  busyLabel: string
  disabled: boolean
}) {
  return (
    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
      <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
        Cancelar
      </Button>
      <Button type="submit" disabled={disabled || busy}>
        {busy ? busyLabel : submitLabel}
      </Button>
    </div>
  )
}
