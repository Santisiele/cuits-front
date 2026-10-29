import { useState } from "react"
import { toast } from "sonner"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCrmMutations } from "@/hooks/useCrm"
import { getErrorMessage } from "@/lib/errors"
import { formatTaxId } from "@/lib/cuit"
import type { CrmContact } from "@/types"
import { ChangeHistory } from "../ChangeHistory"
import { ContactDialog } from "../ContactDialog"
import { undo } from "./undo"

export function ContactsSection({ taxId, contacts }: { taxId: string; contacts: CrmContact[] }) {
  const { archiveContact, restoreContact } = useCrmMutations()
  const [editing, setEditing] = useState<CrmContact | "new" | null>(null)

  async function archive(contact: CrmContact): Promise<void> {
    try {
      await archiveContact.mutateAsync(contact.id)
      toast.success(`Se archivó a ${contact.fullName}`, {
        action: { label: "Deshacer", onClick: () => void undo(() => restoreContact.mutateAsync(contact.id)) },
      })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Contactos</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
            <Plus className="w-4 h-4 mr-1" />
            Contacto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin contactos.</p>
        ) : (
          <div className="divide-y divide-border">
            {contacts.map((contact) => (
              <div key={contact.id} className="py-2 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="text-sm space-y-0.5 min-w-0">
                  <p className="font-medium">{contact.fullName}</p>
                  <p className="text-muted-foreground break-words">
                    {[contact.phone, contact.email, contact.birthday && `cumple ${contact.birthday}`, contact.cuil && `CUIL ${formatTaxId(contact.cuil)}`]
                      .filter(Boolean)
                      .join(" · ") || "Sin datos de contacto"}
                  </p>
                  <ChangeHistory entityType="Contact" entityId={contact.id} names={{}} />
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="ghost" aria-label={`Editar ${contact.fullName}`} onClick={() => setEditing(contact)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" aria-label={`Archivar ${contact.fullName}`} disabled={archiveContact.isPending} onClick={() => void archive(contact)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {editing && <ContactDialog companyTaxId={taxId} contact={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </Card>
  )
}
