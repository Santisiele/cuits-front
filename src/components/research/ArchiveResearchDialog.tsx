import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useArchiveResearch } from "@/hooks/useResearch"
import { getErrorMessage } from "@/lib/errors"

export function ArchiveResearchDialog({ researchId, onClose }: { researchId: string; onClose: () => void }) {
  const archive = useArchiveResearch()
  const [error, setError] = useState("")

  async function handleArchive(): Promise<void> {
    setError("")
    try {
      await archive.mutateAsync(researchId)
      toast.success("Búsqueda archivada")
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>¿Archivar esta búsqueda?</DialogTitle>
          <DialogDescription>
            Va a dejar de verse en la ficha y en Créditos IA. No se borra: el creador la puede ver en Búsquedas archivadas.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={archive.isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => void handleArchive()} disabled={archive.isPending}>
            {archive.isPending ? "Archivando..." : "Archivar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
