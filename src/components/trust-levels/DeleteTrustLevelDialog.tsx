import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PasswordConfirmStep } from "@/components/sources/PasswordConfirmStep"
import { useSourceOperationFlow } from "@/hooks/useSourceOperationFlow"
import { useTrustLevelMutations } from "@/hooks/useTrustLevels"
import { describeTrustLevelOperation } from "@/lib/operationMessages"
import type { TrustLevelInfo, TrustLevelOperationSummary } from "@/types"

interface DeleteTrustLevelDialogProps {
  open: boolean
  onClose: () => void
  level: TrustLevelInfo
}

export function DeleteTrustLevelDialog({ open, onClose, level }: DeleteTrustLevelDialogProps) {
  const { remove } = useTrustLevelMutations()

  const flow = useSourceOperationFlow<TrustLevelOperationSummary>(
    (password, dryRun) => remove.mutateAsync([level.value, password, dryRun]),
    onClose,
    describeTrustLevelOperation
  )

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Borrar "{level.label}"</DialogTitle>
        </DialogHeader>

        {flow.step === "form" && (
          <div className="space-y-4">
            <p className="text-sm">
              Los CUITs que tengan este nivel vuelven a quedar sin nivel.
            </p>
            {flow.error && <p className="text-destructive text-sm">{flow.error}</p>}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={onClose} disabled={flow.loading}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => void flow.requestPreview()} disabled={flow.loading}>
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
              <Button variant="destructive" onClick={flow.goToPassword} disabled={flow.loading}>
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
