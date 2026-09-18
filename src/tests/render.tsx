import { act, type ReactElement } from "react"
import { render as rtlRender } from "@testing-library/react"

export function render(ui: ReactElement): ReturnType<typeof rtlRender> {
  let result!: ReturnType<typeof rtlRender>
  act(() => {
    result = rtlRender(ui)
  })
  return result
}
