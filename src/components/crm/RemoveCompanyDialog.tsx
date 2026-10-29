import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCrmMutations, useCrmRemovalPreview } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { removalText } from "@/lib/crm"

export function RemoveCompanyDialog({ taxId, businessName, onClose }: { taxId: string; businessName: string; onClose: () => void }) {
  const { removeCompany } = useCrmMutations()
  const preview = useCrmRemovalPreview(taxId)
  const navigate = useNavigate()
  const [error, setError] = useState("")

  async function confirm(): Promise<void> {
    setError("")
    try {
      await removeCompany.mutateAsync({ taxId, dryRun: false })
      toast.success(`${businessName} salió del CRM`)
      onClose()
      void navigate("/crm")
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sacar del CRM</DialogTitle>
          <DialogDescription>{businessName}</DialogDescription>
        </DialogHeader>
        {preview.data ? (
          <p className="text-sm">{removalText(preview.data)}</p>
        ) : preview.error ? (
          <p className="text-destructive text-sm">{getErrorMessage(preview.error)}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Calculando...</p>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={removeCompany.isPending}>Cancelar</Button>
          <Button variant="destructive" onClick={() => void confirm()} disabled={!preview.data || removeCompany.isPending}>
            {removeCompany.isPending ? "Sacando..." : "Sacar del CRM"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
