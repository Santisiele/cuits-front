import { describe, it, expect } from "vitest"
import {
  toIsoDate,
  fromIsoDate,
  todayString,
  daysFromTodayString,
  rangeEndsBeforeItStarts,
  monthNameOf,
  MONTH_NAMES,
} from "@/lib/dates"

describe("toIsoDate", () => {
  it("turns dd/mm/yyyy into what a date input wants", () => {
    expect(toIsoDate("30/07/2004")).toBe("2004-07-30")
  })

  it("pads a single-digit day and month", () => {
    expect(toIsoDate("5/7/2004")).toBe("2004-07-05")
  })

  it("accepts dashes as separators", () => {
    expect(toIsoDate("30-07-2004")).toBe("2004-07-30")
  })

  it("gives back an empty string for junk", () => {
    expect(toIsoDate("hola")).toBe("")
  })

  it("gives back an empty string for a two-digit year", () => {
    expect(toIsoDate("30/07/04")).toBe("")
  })
})

describe("fromIsoDate", () => {
  it("turns what the date input emits back into dd/mm/yyyy", () => {
    expect(fromIsoDate("2004-07-30")).toBe("30/07/2004")
  })

  it("gives back an empty string when the picker is cleared", () => {
    expect(fromIsoDate("")).toBe("")
  })

  it("round-trips with toIsoDate", () => {
    expect(fromIsoDate(toIsoDate("30/07/2004"))).toBe("30/07/2004")
  })
})

describe("todayString", () => {
  it("pads both parts", () => {
    expect(todayString(new Date(2026, 0, 5))).toBe("05/01/2026")
  })
})

describe("daysFromTodayString", () => {
  it("walks forward the number of days given", () => {
    expect(daysFromTodayString(30, new Date(2026, 8, 17))).toBe("17/10/2026")
  })

  it("crosses the year boundary", () => {
    expect(daysFromTodayString(30, new Date(2026, 11, 20))).toBe("19/01/2027")
  })

  it("does not mutate the date it was given", () => {
    const start = new Date(2026, 8, 17)
    daysFromTodayString(30, start)
    expect(todayString(start)).toBe("17/09/2026")
  })
})

describe("rangeEndsBeforeItStarts", () => {
  it("catches an end date before the start date in the same year", () => {
    expect(rangeEndsBeforeItStarts("20/12/2026", "05/01/2026")).toBe(true)
  })

  it("allows the range to wrap into the next year", () => {
    expect(rangeEndsBeforeItStarts("20/12/2026", "05/01/2027")).toBe(false)
  })

  it("allows a plain forward range", () => {
    expect(rangeEndsBeforeItStarts("01/03/2026", "31/03/2026")).toBe(false)
  })

  it("allows the same day on both ends", () => {
    expect(rangeEndsBeforeItStarts("17/09/2026", "17/09/2026")).toBe(false)
  })

  it("says nothing while a date is still empty", () => {
    expect(rangeEndsBeforeItStarts("", "05/01/2026")).toBe(false)
  })

  it("says nothing when a date is unparseable", () => {
    expect(rangeEndsBeforeItStarts("hola", "05/01/2026")).toBe(false)
  })

  it("agrees with the default range the screen opens with", () => {
    const from = todayString(new Date(2026, 11, 20))
    const to = daysFromTodayString(30, new Date(2026, 11, 20))
    expect(rangeEndsBeforeItStarts(from, to)).toBe(false)
  })
})

describe("monthNameOf", () => {
  it("names the month of a birthday", () => {
    expect(monthNameOf("30/07/2004")).toBe("Julio")
  })

  it("reads a single-digit month", () => {
    expect(monthNameOf("5/1/1950")).toBe("Enero")
  })

  it("reads December, the last one", () => {
    expect(monthNameOf("25/12/1990")).toBe("Diciembre")
  })

  it("accepts dashes", () => {
    expect(monthNameOf("01-03-2000")).toBe("Marzo")
  })

  it("gives nothing for a month that does not exist", () => {
    expect(monthNameOf("01/13/2000")).toBeNull()
  })

  it("gives nothing for an empty birthday", () => {
    expect(monthNameOf("")).toBeNull()
  })

  it("lists the twelve months in calendar order", () => {
    expect(MONTH_NAMES).toHaveLength(12)
    expect(MONTH_NAMES[0]).toBe("Enero")
    expect(MONTH_NAMES[11]).toBe("Diciembre")
  })
})
