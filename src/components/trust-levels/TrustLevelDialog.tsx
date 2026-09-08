import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PasswordConfirmStep } from "@/components/sources/PasswordConfirmStep"
import { useSourceOperationFlow } from "@/hooks/useSourceOperationFlow"
import { useTrustLevelMutations } from "@/hooks/useTrustLevels"
import { TRUST_LEVEL_COLOR_KEYS, TRUST_LEVEL_PALETTE } from "@/lib/trustLevels"
import { describeTrustLevelOperation } from "@/lib/operationMessages"
import { cn } from "@/lib/utils"
import type { TrustLevelColor, TrustLevelInfo, TrustLevelOperationSummary } from "@/types"

interface TrustLevelDialogProps {
  open: boolean
  onClose: () => void
  level: TrustLevelInfo | null
}

function ColorPicker({
  value,
  onChange,
}: {
  value: TrustLevelColor
  onChange: (color: TrustLevelColor) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TRUST_LEVEL_COLOR_KEYS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          title={TRUST_LEVEL_PALETTE[color].label}
          className={cn(
            "h-8 w-8 rounded-none ring-offset-2 ring-offset-background transition-all",
            TRUST_LEVEL_PALETTE[color].swatch,
            value === color ? "ring-2 ring-foreground" : "opacity-60 hover:opacity-100"
          )}
        />
      ))}
    </div>
  )
}

export function TrustLevelDialog({ open, onClose, level }: TrustLevelDialogProps) {
  const { create, update } = useTrustLevelMutations()
  const [label, setLabel] = useState(level?.label ?? "")
  const [color, setColor] = useState<TrustLevelColor>(level?.color ?? "slate")
  const [adopted, setAdopted] = useState(level?.value ?? null)

  if ((level?.value ?? null) !== adopted) {
    setAdopted(level?.value ?? null)
    setLabel(level?.label ?? "")
    setColor(level?.color ?? "slate")
  }

  const flow = useSourceOperationFlow<TrustLevelOperationSummary>(
    (password, dryRun) =>
      level
        ? update.mutateAsync([level.value, label.trim(), color, password, dryRun])
        : create.mutateAsync([label.trim(), color, password, dryRun]),
    onClose,
    describeTrustLevelOperation
  )

  const canSubmit = label.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{level ? `Editar "${level.label}"` : "Nuevo nivel"}</DialogTitle>
        </DialogHeader>

        {flow.step === "form" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Por ejemplo: Ignorar"
                autoFocus
                disabled={flow.loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            {flow.error && <p className="text-destructive text-sm">{flow.error}</p>}

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={onClose} disabled={flow.loading}>
                Cancelar
              </Button>
              <Button onClick={() => void flow.requestPreview()} disabled={!canSubmit || flow.loading}>
                {flow.loading ? "Calculando..." : "Continuar"}
              </Button>
            </div>
          </div>
        )}

        {flow.step === "preview" && flow.preview && (
          <div className="space-y-4">
            <p className="text-sm">{describeTrustLevelOperation(flow.preview)}</p>
            {flow.error && <p className="text-destructive text-sm">{flow.error}</p>}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={onClose} disabled={flow.loading}>
                Cancelar
              </Button>
              <Button onClick={flow.goToPassword} disabled={flow.loading}>
                Confirmar
              </Button>
            </div>
          </div>
        )}

        {flow.step === "password" && (
          <PasswordConfirmStep
            loading={flow.loading}
            error={flow.error}
            onExecute={(password) => void flow.execute(password)}
            onBack={flow.backToPreview}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
