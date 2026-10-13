import { describe, it, expect } from "vitest"
import {
  NO_SWEEP_YET,
  formatCount,
  formatMissedOn,
  lastUpdateText,
  matchesPerson,
  missingText,
  peopleWithBirthdayText,
  progressPercent,
  progressShare,
  sweepText,
} from "@/lib/birthdayProgress"

describe("formatCount", () => {
  it("groups thousands with a dot", () => {
    expect(formatCount(1348)).toBe("1.348")
    expect(formatCount(12)).toBe("12")
  })
})

describe("progressShare", () => {
  it("is the part over the total", () => {
    expect(progressShare(61, 100)).toBe(0.61)
  })

  it("is zero when there is nothing to count", () => {
    expect(progressShare(5, 0)).toBe(0)
  })

  it("stays between zero and one", () => {
    expect(progressShare(150, 100)).toBe(1)
    expect(progressShare(-1, 100)).toBe(0)
  })
})

describe("progressPercent", () => {
  it("rounds to a whole percent", () => {
    expect(progressPercent(1348, 2101)).toBe(64)
  })
})

describe("peopleWithBirthdayText", () => {
  it("reads as a sentence with grouped numbers", () => {
    expect(peopleWithBirthdayText(1348, 2101)).toBe("1.348 de 2.101 personas con cumpleaños")
  })
})

describe("missingText", () => {
  it("speaks of one person in the singular", () => {
    expect(missingText(1)).toBe("Falta 1 persona")
  })

  it("speaks of several people in the plural", () => {
    expect(missingText(753)).toBe("Faltan 753 personas")
    expect(missingText(0)).toBe("Faltan 0 personas")
  })
})

describe("sweepText", () => {
  it("shows today's consultations against the limit", () => {
    expect(sweepText(61, 100)).toBe("Hoy: 61 de 100 consultas")
  })
})

describe("lastUpdateText", () => {
  it("shows the moment in Buenos Aires time", () => {
    expect(lastUpdateText("2026-10-13T15:04:00.000Z")).toBe("Última actualización: 13/10/2026 12:04")
  })

  it("says the sweep has not run yet when there is no moment", () => {
    expect(lastUpdateText(null)).toBe(NO_SWEEP_YET)
  })

  it("treats an unreadable moment as no moment", () => {
    expect(lastUpdateText("ayer")).toBe(NO_SWEEP_YET)
  })
})

describe("formatMissedOn", () => {
  it("turns an ISO day into dd/mm/yyyy", () => {
    expect(formatMissedOn("2026-09-17")).toBe("17/09/2026")
  })

  it("leaves anything else as it came", () => {
    expect(formatMissedOn("17/09/2026")).toBe("17/09/2026")
  })
})

describe("matchesPerson", () => {
  const person = { taxId: "20111111112", businessName: "PEREZ JUAN" }

  it("lets everyone through an empty search", () => {
    expect(matchesPerson(person, "  ")).toBe(true)
  })

  it("finds by name ignoring case", () => {
    expect(matchesPerson(person, "perez")).toBe(true)
    expect(matchesPerson(person, "gomez")).toBe(false)
  })

  it("finds by CUIT with or without dashes", () => {
    expect(matchesPerson(person, "20-11111111-2")).toBe(true)
    expect(matchesPerson(person, "1111")).toBe(true)
    expect(matchesPerson(person, "999")).toBe(false)
  })
})
