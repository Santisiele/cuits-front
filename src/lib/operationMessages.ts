import type { OperationSummary } from "@/types"

/**
 * Builds the Spanish sentence shown for a source admin operation.
 *
 * The API answers in English and carries the interpolated values (names,
 * counts) inside its `message`, which makes that string impossible to
 * translate with a lookup table. Everything needed to write the sentence is
 * already in the structured fields, so the wording is composed here instead —
 * the backend's `message` stays as an English trace for logs.
 */
export function describeOperation(summary: OperationSummary): string {
  const {
    operation,
    affectedNodeCount,
    removedNodeCount,
    updatedNodeCount,
    createdSourceName,
    removedSourceName,
    dryRun,
  } = summary

  const cuits = (n: number) => `${n} CUIT${n === 1 ? "" : "s"}`

  switch (operation) {
    case "rename":
      return dryRun
        ? `Se renombraría "${removedSourceName}" a "${createdSourceName}", afectando ${cuits(affectedNodeCount)}.`
        : `Se renombró "${removedSourceName}" a "${createdSourceName}", afectando ${cuits(updatedNodeCount)}.`

    case "merge":
      return dryRun
        ? `Se unificaría "${removedSourceName}" dentro de "${createdSourceName}", moviendo ${cuits(affectedNodeCount)}.`
        : `Se unificó "${removedSourceName}" dentro de "${createdSourceName}", moviendo ${cuits(updatedNodeCount)}.`

    case "delete": {
      const removed =
        removedNodeCount > 0
          ? ` ${cuits(removedNodeCount)} ${removedNodeCount === 1 ? "queda" : "quedan"} sin fuentes y se ${removedNodeCount === 1 ? "elimina" : "eliminan"}.`
          : " Ningún CUIT queda sin fuentes."
      return dryRun
        ? `Se borraría "${removedSourceName}", afectando ${cuits(affectedNodeCount)}.${removed}`
        : `Se borró "${removedSourceName}", afectando ${cuits(affectedNodeCount)}.${removed}`
    }

    case "add-source":
      return dryRun
        ? `Se agregaría la fuente "${createdSourceName}".`
        : `Se agregó la fuente "${createdSourceName}".`

    case "move-source": {
      /** A move onto the source the node already had is reported as a no-op. */
      if (affectedNodeCount === 0) return "El CUIT ya estaba en esa fuente, no hubo cambios."
      return dryRun
        ? `Se movería de "${removedSourceName}" a "${createdSourceName}".`
        : `Se movió de "${removedSourceName}" a "${createdSourceName}".`
    }
  }
}
