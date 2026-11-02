export function keepOpenWhileDirty(dirty: boolean): { onInteractOutside: (event: Event) => void; onEscapeKeyDown: (event: Event) => void } {
  const keep = (event: Event) => {
    if (dirty) event.preventDefault()
  }
  return { onInteractOutside: keep, onEscapeKeyDown: keep }
}
