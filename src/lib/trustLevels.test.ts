import { describe, it, expect } from "vitest"
import { parseLevelParam } from "@/lib/trustLevels"

describe("parseLevelParam", () => {
  it("reads a level from the address", () => {
    expect(parseLevelParam("4")).toBe(4)
  })

  it("reads a level with more than one digit", () => {
    expect(parseLevelParam("12")).toBe(12)
  })

  it("refuses level 0, which has no list", () => {
    expect(parseLevelParam("0")).toBeNull()
  })

  it("refuses a missing value", () => {
    expect(parseLevelParam(undefined)).toBeNull()
  })

  it("refuses an empty value", () => {
    expect(parseLevelParam("")).toBeNull()
  })

  it("refuses text", () => {
    expect(parseLevelParam("alto")).toBeNull()
  })

  it("refuses a decimal", () => {
    expect(parseLevelParam("2.5")).toBeNull()
  })

  it("refuses a negative number", () => {
    expect(parseLevelParam("-1")).toBeNull()
  })

  it("refuses spaces the router would never produce", () => {
    expect(parseLevelParam(" 4")).toBeNull()
  })
})
