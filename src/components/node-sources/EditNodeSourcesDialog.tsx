import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Plus } from "lucide-react"
import { useSourcesQuery } from "@/hooks/useSourcesQuery"
import { useChangeNodeSource } from "@/hooks/useSourceMutations"
import { useSourceOperationFlow } from "@/hooks/useSourceOperationFlow"
import { OperationPreview } from "@/components/sources/OperationPreview"
import { PasswordConfirmStep } from "@/components/sources/PasswordConfirmStep"
import type { NodeData } from "@/types"

interface EditNodeSourcesDialogProps {
  node: NodeData
  onClose: () => void
}

/**
 * Adds a source to one node, or moves the node from one of its sources to
 * another.
 *
 * Both modes change the node's isKnown/isToKnow flags, because the backend
 * recalculates them from the categories of whatever sources remain attached.
 * A move can never leave the node without sources, so it can never delete it.
 */
export function EditNodeSourcesDialog({ node, onClose }: EditNodeSourcesDialogProps) {
  const { data: allSources = [] } = useSourcesQuery()
  const changeMutation = useChangeNodeSource()

  const [mode, setMode] = useState<"add" | "move">("add")
  const [targetSource, setTargetSource] = useState("")
  const [fromSource, setFromSource] = useState("")

  const current = node.sources ?? []
  const available = allSources.filter((source) => !current.includes(source.name))

  const flow = useSourceOperationFlow(
    (password, dryRun) =>
      changeMutation.mutateAsync({
        taxId: node.taxId,
        sourceName: targetSource,
        mode,
        fromSource: mode === "move" ? fromSource : null,
        password,
        dryRun,
      }),
    onClose
  )

  const canPreview =
    targetSource.length > 0 && (mode === "add" || fromSource.length > 0)

  function selectMode(next: "add" | "move"): void {
    setMode(next)
    setTargetSource("")
    setFromSource("")
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fuentes de {node.businessName ?? node.taxId}</DialogTitle>
          <DialogDescription>
            Agregá una fuente nueva o mové el nodo de una fuente a otra.
          </DialogDescription>
        </DialogHeader>

        {flow.step === "form" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Fuentes actuales</p>
              <div className="flex gap-2 flex-wrap">
                {current.length > 0 ? (
                  current.map((source) => (
                    <Badge key={source} variant="outline">
                      {source}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Ninguna</span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={mode === "add" ? "default" : "outline"}
                size="sm"
                onClick={() => selectMode("add")}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
              <Button
                variant={mode === "move" ? "default" : "outline"}
                size="sm"
                onClick={() => selectMode("move")}
                disabled={current.length === 0}
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                Mover
              </Button>
            </div>

            {mode === "move" && (
              <div className="space-y-2">
                <p className="text-sm">Sacar de:</p>
                <Select value={fromSource} onValueChange={setFromSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elegí la fuente de origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {current.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm">{mode === "add" ? "Agregar a:" : "Mover a:"}</p>
              <Select value={targetSource} onValueChange={setTargetSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegí la fuente de destino" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((source) => (
                    <SelectItem key={source.name} value={source.name}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {available.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  El nodo ya pertenece a todas las fuentes existentes.
                </p>
              )}
            </div>

            {flow.error && <p className="text-destructive text-sm">{flow.error}</p>}

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button variant="outline" onClick={onClose} disabled={flow.loading}>
                Cancelar
              </Button>
              <Button
                onClick={() => void flow.requestPreview()}
                disabled={!canPreview || flow.loading}
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
