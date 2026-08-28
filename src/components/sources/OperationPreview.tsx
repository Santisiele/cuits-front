import { Button } from "@/components/ui/button"
import { describeOperation } from "@/lib/operationMessages"
import type { OperationSummary } from "@/types"

interface OperationPreviewProps {
  /** Result of the dry run, describing what the real call would do. */
  summary: OperationSummary
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Second step of every destructive flow: shows what the operation would do,
 * measured by a dry run against real data rather than estimated client-side.
 *
 * `removedNodeCount` is the number that matters — those nodes are deleted, not
 * just edited — so it is the one called out in destructive styling.
 */
export function OperationPreview({
  summary,
  loading,
  onConfirm,
  onCancel,
}: OperationPreviewProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm">{describeOperation(summary)}</p>

      <div className="rounded-md border border-border p-3 space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">CUITs afectados</span>
          <strong>{summary.affectedNodeCount}</strong>
        </div>
        {summary.updatedNodeCount > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Se actualizan</span>
            <strong>{summary.updatedNodeCount}</strong>
          </div>
        )}
        {summary.removedNodeCount > 0 && (
          <div className="flex justify-between gap-4 text-destructive">
            <span>Se eliminan por quedar sin fuentes</span>
            <strong>{summary.removedNodeCount}</strong>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} disabled={loading}>
          Confirmar
        </Button>
      </div>
    </div>
  )
}
