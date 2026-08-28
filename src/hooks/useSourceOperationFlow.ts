import { useState } from "react"
import { toast } from "sonner"
import { getErrorMessage, translateApiError } from "@/lib/errors"
import { describeOperation } from "@/lib/operationMessages"
import type { OperationSummary } from "@/types"

/**
 * Steps every destructive source operation walks through.
 * `form` collects whatever the operation needs, `preview` shows the dry run,
 * `password` takes the step-up credential.
 */
export type FlowStep = "form" | "preview" | "password"

/**
 * Runs one source operation. `password` is null on a dry run, where the
 * backend neither expects nor checks it.
 */
type RunOperation = (password: string | null, dryRun: boolean) => Promise<OperationSummary>

/**
 * Drives the shared form → preview → password flow.
 *
 * Rename, merge and delete differ only in what their form collects and which
 * endpoint they hit, so the stepping, error handling and success reporting
 * live here rather than being repeated in each dialog.
 *
 * A failed execution keeps the dialog open on the password step: the common
 * case is a mistyped password, and closing would throw away a preview the user
 * would have to run again.
 */
export function useSourceOperationFlow(run: RunOperation, onClose: () => void) {
  const [step, setStep] = useState<FlowStep>("form")
  const [preview, setPreview] = useState<OperationSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function requestPreview(): Promise<void> {
    setError(null)
    setLoading(true)
    try {
      setPreview(await run(null, true))
      setStep("preview")
    } catch (err) {
      setError(translateApiError(getErrorMessage(err, "Error inesperado")))
    } finally {
      setLoading(false)
    }
  }

  async function execute(password: string): Promise<void> {
    setError(null)
    setLoading(true)
    try {
      const summary = await run(password, false)
      toast.success(describeOperation(summary))
      onClose()
    } catch (err) {
      setError(translateApiError(getErrorMessage(err, "Error inesperado")))
    } finally {
      setLoading(false)
    }
  }

  function goToPassword(): void {
    setError(null)
    setStep("password")
  }

  function backToPreview(): void {
    setError(null)
    setStep("preview")
  }

  return { step, preview, error, loading, requestPreview, execute, goToPassword, backToPreview }
}
