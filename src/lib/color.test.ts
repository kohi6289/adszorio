import { describe, expect, it } from "vitest";
import { contrast, ensureContrast } from "./color";

describe("ensureContrast", () => {
  it("keeps a colour that already passes", () => expect(ensureContrast("#0B7A5C", "#FAFAF7")).toBe("#0B7A5C"));
  it("darkens pure YouTube red on the light background", () => {
    const out = ensureContrast("#FF0000", "#FAFAF7");
    expect(contrast(out, "#FAFAF7")).toBeGreaterThanOrEqual(4.5);
  });
  it("lightens a dark brand colour on the dark background", () => {
    const out = ensureContrast("#1A1A40", "#0C0D10");
    expect(contrast(out, "#0C0D10")).toBeGreaterThanOrEqual(4.5);
  });
});
