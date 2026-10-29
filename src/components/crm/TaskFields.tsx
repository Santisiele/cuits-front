import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toggleId, type TaskDraft, type TaskDraftErrors } from "@/lib/crm"
import type { CrmContact } from "@/types"
import { CheckRow, Field } from "./CrmFields"
import { ResponsibleSelect } from "./ResponsibleSelect"

export function TaskFields({
  idPrefix,
  draft,
  errors,
  contacts,
  onChange,
}: {
  idPrefix: string
  draft: TaskDraft
  errors: TaskDraftErrors
  contacts: CrmContact[]
  onChange: (draft: TaskDraft) => void
}) {
  function toggleContact(id: string, checked: boolean): void {
    onChange({ ...draft, contactIds: toggleId(draft.contactIds, id, checked) })
  }

  return (
    <div className="space-y-4">
      <Field id={`${idPrefix}-description`} label="Tarea" error={draft.description ? errors.description : null}>
        <Textarea
          id={`${idPrefix}-description`}
          value={draft.description}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
          rows={2}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${idPrefix}-due`} label="Vence" error={draft.dueDate ? errors.dueDate : null}>
          <Input id={`${idPrefix}-due`} type="date" value={draft.dueDate} onChange={(e) => onChange({ ...draft, dueDate: e.target.value })} />
        </Field>
        <Field id={`${idPrefix}-assignee`} label="Quién lo hará">
          <ResponsibleSelect id={`${idPrefix}-assignee`} value={draft.assignee} onChange={(assignee) => onChange({ ...draft, assignee })} />
        </Field>
      </div>
      {contacts.length > 0 && (
        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">Con quién</legend>
          {contacts.map((contact) => (
            <CheckRow key={contact.id} checked={draft.contactIds.includes(contact.id)} onChange={(checked) => toggleContact(contact.id, checked)}>
              {contact.fullName}
            </CheckRow>
          ))}
        </fieldset>
      )}
    </div>
  )
}
