import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"
import { unmountHooks } from "@/tests/render"

afterEach(() => {
  unmountHooks()
  cleanup()
})
