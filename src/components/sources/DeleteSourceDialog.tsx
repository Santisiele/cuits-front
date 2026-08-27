import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDeleteSource } from "@/hooks/useSourceMutations"
import { useSourceOperationFlow } from "@/hooks/useSourceOperationFlow"
import { OperationPreview } from "./OperationPreview"
import { PasswordConfirmStep } from "./PasswordConfirmStep"
import type { SourceInfo } from "@/types"

interface DeleteSourceDialogProps {
  source: SourceInfo
  onClose: () => void
}

/**
 * Deletes a source. This is the only operation that removes nodes: a node left
 * with no source at all and no link to the base is deleted with it.
 *
 * Typing the exact name is required before the preview can even be requested —
 * the same guard used by tools where the action cannot be undone.
 */
export function DeleteSourceDialog({ source, onClose }: DeleteSourceDialogProps) {
  const [confirmText, setConfirmText] = useState("")
  const deleteMutation = useDeleteSource()

  const flow = useSourceOperationFlow(
    (password, dryRun) =>
      deleteMutation.mutateAsync({ name: source.name, password, dryRun }),
    onClose
  )

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Borrar "{source.name}"</DialogTitle>
          <DialogDescription>Esta operación no se puede deshacer.</DialogDescription>
        </DialogHeader>

        {flow.step === "form" && (
          <div className="space-y-4">
            <p className="text-sm text-destructive">
              Se va a eliminar la fuente y todos los CUITs que dependan exclusivamente
              de ella. Los CUITs que también estén en otra fuente se conservan.
            </p>

            <div className="space-y-2">
              <p className="text-sm">
                Escribí <strong>{source.name}</strong> para confirmar:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={source.name}
                autoFocus
                disabled={flow.loading}
              />
            </div>

            {flow.error && <p className="text-destructive text-sm">{flow.error}</p>}

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={onClose} disabled={flow.loading}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => void flow.requestPreview()}
                disabled={confirmText !== source.name || flow.loading}
              >
                {flow.loading ? "Calculando..." : "Ver preview"}
              </Button>
            </div>
          </div>
        )}

        {flow.step === "preview" && flow.preview && (
          <OperationPreview
            summary={flow.preview}
            loading={flow.loading}
            onConfirm={flow.goToPassword}
            onCancel={onClose}
          />
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
