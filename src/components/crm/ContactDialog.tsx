import { useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCrmMutations } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import {
  FULL_NAME_REQUIRED,
  MAX_NAME_LENGTH,
  birthdayError,
  cuitDigits,
  cuitError,
  optionalNameError,
  optionalText,
  requiredTextError,
} from "@/lib/crm"
import type { CrmContact } from "@/types"
import { DialogButtons, Field } from "./CrmFields"

export function ContactDialog({ companyTaxId, contact, onClose }: { companyTaxId: string; contact: CrmContact | null; onClose: () => void }) {
  const { createContact, updateContact } = useCrmMutations()
  const [fullName, setFullName] = useState(contact?.fullName ?? "")
  const [phone, setPhone] = useState(contact?.phone ?? "")
  const [email, setEmail] = useState(contact?.email ?? "")
  const [birthday, setBirthday] = useState(contact?.birthday ?? "")
  const [cuil, setCuil] = useState(contact?.cuil ?? "")
  const [error, setError] = useState("")
  const busy = createContact.isPending || updateContact.isPending

  const nameProblem = fullName ? requiredTextError(fullName, FULL_NAME_REQUIRED, MAX_NAME_LENGTH) : null
  const phoneProblem = optionalNameError(phone)
  const emailProblem = optionalNameError(email)
  const birthdayProblem = birthdayError(birthday)
  const cuilLocked = !!contact?.cuil
  const cuilProblem = cuil && !cuilLocked ? cuitError(cuil) : null
  const canSubmit = !!fullName.trim() && !nameProblem && !phoneProblem && !emailProblem && !birthdayProblem && !cuilProblem

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (!canSubmit) return
    setError("")
    const input = {
      fullName: fullName.trim(),
      phone: optionalText(phone),
      email: optionalText(email),
      birthday: optionalText(birthday),
      ...(cuilLocked || !cuil.trim() ? {} : { cuil: cuitDigits(cuil) }),
    }
    try {
      if (contact) await updateContact.mutateAsync({ id: contact.id, input })
      else await createContact.mutateAsync({ ...input, companyTaxIds: [companyTaxId] })
      toast.success(contact ? "Se guardó el contacto" : "Se agregó el contacto")
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? "Editar contacto" : "Nuevo contacto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Field id="crm-contact-name" label="Nombre" error={nameProblem}>
            <Input id="crm-contact-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
          </Field>
          <Field id="crm-contact-phone" label="Teléfono" error={phoneProblem}>
            <Input id="crm-contact-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field id="crm-contact-email" label="Email" error={emailProblem}>
            <Input id="crm-contact-email" type="text" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field id="crm-contact-birthday" label="Cumpleaños" error={birthdayProblem} hint="dd/mm/aaaa">
            <Input id="crm-contact-birthday" value={birthday} onChange={(e) => setBirthday(e.target.value)} placeholder="dd/mm/aaaa" />
          </Field>
          <Field
            id="crm-contact-cuil"
            label="CUIL"
            error={cuilProblem}
            hint={cuilLocked ? "El CUIL no se puede cambiar" : "Opcional. Si lo cargás, la persona entra al CRM y a la búsqueda de cumpleaños"}
          >
            <Input id="crm-contact-cuil" value={cuil} onChange={(e) => setCuil(e.target.value)} inputMode="numeric" disabled={cuilLocked} />
          </Field>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogButtons onCancel={onClose} busy={busy} submitLabel="Guardar" busyLabel="Guardando..." disabled={!canSubmit} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
