import { act, type ComponentType, type ReactElement, type ReactNode } from "react"
import { createRoot } from "react-dom/client"
import { render as rtlRender } from "@testing-library/react"

export function render(ui: ReactElement): ReturnType<typeof rtlRender> {
  let result!: ReturnType<typeof rtlRender>
  act(() => {
    result = rtlRender(ui)
  })
  return result
}

const mounted: (() => void)[] = []

export function unmountHooks(): void {
  while (mounted.length > 0) mounted.pop()!()
}

export interface HookHandle<Result> {
  result: { current: Result }
  unmount: () => void
}

export function renderHook<Result>(
  hook: () => Result,
  options: { wrapper?: ComponentType<{ children: ReactNode }> } = {}
): HookHandle<Result> {
  const result = { current: undefined as Result }
  const Wrapper = options.wrapper ?? (({ children }: { children: ReactNode }) => <>{children}</>)

  function Probe() {
    result.current = hook()
    return null
  }

  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <Wrapper>
        <Probe />
      </Wrapper>
    )
  })

  const unmount = () => {
    act(() => root.unmount())
    container.remove()
  }
  mounted.push(unmount)

  return { result, unmount }
}
