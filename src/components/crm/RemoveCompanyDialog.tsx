import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCrmMutations } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { removalText } from "@/lib/crm"
import type { CrmRemovalResult } from "@/types"

export function RemoveCompanyDialog({ taxId, businessName, onClose }: { taxId: string; businessName: string; onClose: () => void }) {
  const { removeCompany } = useCrmMutations()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<CrmRemovalResult | null>(null)
  const [error, setError] = useState("")
  const { mutateAsync } = removeCompany

  useEffect(() => {
    mutateAsync({ taxId, dryRun: true })
      .then(setPreview)
      .catch((err: unknown) => setError(getErrorMessage(err)))
  }, [taxId, mutateAsync])

  async function confirm(): Promise<void> {
    setError("")
    try {
      await mutateAsync({ taxId, dryRun: false })
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
        {preview ? <p className="text-sm">{removalText(preview)}</p> : !error && <p className="text-sm text-muted-foreground">Calculando...</p>}
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={removeCompany.isPending}>Cancelar</Button>
          <Button variant="destructive" onClick={() => void confirm()} disabled={!preview || removeCompany.isPending}>
            {removeCompany.isPending && preview ? "Sacando..." : "Sacar del CRM"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
