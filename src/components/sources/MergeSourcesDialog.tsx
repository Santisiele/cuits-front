import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RESPONSIVE_DIALOG } from "@/lib/dialogStyles"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useMergeSources } from "@/hooks/useSourceMutations"
import { useSourceOperationFlow } from "@/hooks/useSourceOperationFlow"
import { OperationPreview } from "./OperationPreview"
import { PasswordConfirmStep } from "./PasswordConfirmStep"
import type { SourceInfo } from "@/types"

interface MergeSourcesDialogProps {
  sourceA: SourceInfo
  sourceB: SourceInfo
  onClose: () => void
}

/**
 * Merges two sources into one. The user picks which name survives; the other
 * is deleted and its nodes are re-attached to the survivor.
 *
 * No node is ever lost: every node of the dropped source ends up on the kept
 * one, which is also why the backend only allows this within a single category.
 */
export function MergeSourcesDialog({ sourceA, sourceB, onClose }: MergeSourcesDialogProps) {
  const [keepName, setKeepName] = useState(sourceA.name)
  const mergeMutation = useMergeSources()

  const dropName = keepName === sourceA.name ? sourceB.name : sourceA.name

  const flow = useSourceOperationFlow(
    (password, dryRun) =>
      mergeMutation.mutateAsync({
        sourceToKeep: keepName,
        sourceToDrop: dropName,
        password,
        dryRun,
      }),
    onClose
  )

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className={RESPONSIVE_DIALOG}>
        <DialogHeader>
          <DialogTitle>Unificar fuentes</DialogTitle>
          <DialogDescription>
            Los CUITs de la fuente que se descarta pasan a la que se conserva. No se
            elimina ningún CUIT.
          </DialogDescription>
        </DialogHeader>

        {flow.step === "form" && (
          <div className="space-y-4">
            <p className="text-sm">Elegí cuál conservar:</p>

            <RadioGroup value={keepName} onValueChange={setKeepName} className="gap-2">
              {[sourceA, sourceB].map((source) => (
                <label
                  key={source.name}
                  className="flex items-center gap-3 rounded-md border border-border p-3 cursor-pointer text-sm"
                >
                  <RadioGroupItem value={source.name} />
                  <span className="flex-1 min-w-0 truncate">{source.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {source.nodeCount} CUITs
                  </span>
                </label>
              ))}
            </RadioGroup>

            <p className="text-xs text-muted-foreground">
              Se va a eliminar <strong>"{dropName}"</strong> y sus CUITs van a quedar en{" "}
              <strong>"{keepName}"</strong>.
            </p>

            {flow.error && <p className="text-destructive text-sm">{flow.error}</p>}

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={onClose} disabled={flow.loading}>
                Cancelar
              </Button>
              <Button onClick={() => void flow.requestPreview()} disabled={flow.loading}>
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
