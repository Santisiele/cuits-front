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
import { useRenameSource } from "@/hooks/useSourceMutations"
import { useSourceOperationFlow } from "@/hooks/useSourceOperationFlow"
import { OperationPreview } from "./OperationPreview"
import { PasswordConfirmStep } from "./PasswordConfirmStep"
import type { SourceInfo } from "@/types"

interface RenameSourceDialogProps {
  source: SourceInfo
  onClose: () => void
}

/**
 * Renames a source. The backend rejects a name that already exists rather than
 * merging into it, so the conflict surfaces as an error on the preview step.
 */
export function RenameSourceDialog({ source, onClose }: RenameSourceDialogProps) {
  const [newName, setNewName] = useState("")
  const renameMutation = useRenameSource()

  const flow = useSourceOperationFlow(
    (password, dryRun) =>
      renameMutation.mutateAsync({
        currentName: source.name,
        newName: newName.trim(),
        password,
        dryRun,
      }),
    onClose
  )

  const trimmed = newName.trim()
  const canPreview = trimmed.length > 0 && trimmed !== source.name

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Renombrar "{source.name}"</DialogTitle>
          <DialogDescription>
            La fuente conserva su categoría y sus {source.nodeCount} CUITs.
          </DialogDescription>
        </DialogHeader>

        {flow.step === "form" && (
          <div className="space-y-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nuevo nombre"
              autoFocus
              disabled={flow.loading}
            />
            {flow.error && <p className="text-destructive text-sm">{flow.error}</p>}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={onClose} disabled={flow.loading}>
                Cancelar
              </Button>
              <Button onClick={() => void flow.requestPreview()} disabled={!canPreview || flow.loading}>
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
