import { toast } from "sonner"
import { getErrorMessage } from "@/lib/errors"

export async function undo(restore: () => Promise<unknown>): Promise<void> {
  try {
    await restore()
    toast.success("Se deshizo")
  } catch (err) {
    toast.error(getErrorMessage(err))
  }
}
