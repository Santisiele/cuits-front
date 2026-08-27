/**
 * Class string shared by every source admin dialog.
 *
 * On phones the dialog takes the whole screen: these flows have three steps
 * and the tallest of them (a select plus a preview plus buttons) does not fit
 * in a centred card, and the base DialogContent has no max-height, so the
 * overflow would simply be unreachable off-screen.
 *
 * From `sm:` up it goes back to a centred card, capped at 85vh and scrolling
 * inside, so a long list of sources never pushes the buttons out of view.
 */
export const RESPONSIVE_DIALOG =
  "inset-0 top-0 left-0 h-full w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none " +
  "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-lg " +
  "sm:-translate-x-1/2 sm:-translate-y-1/2"
