import { describe, expect, it } from "vitest";
import { applyRounding, convertFromUsd, currencyForCountry, formatMoney } from "./currency";
import { packages, services } from "@/data/seed";

const ALL = ["USD", "EUR", "GBP", "CAD", "AUD", "AED"];

describe("currencyForCountry", () => {
  it.each([
    ["US", "USD"], ["GB", "GBP"], ["DE", "EUR"], ["IE", "EUR"], ["CA", "CAD"], ["AU", "AUD"], ["AE", "AED"],
    ["IN", "USD"], ["SA", "USD"], [null, "USD"], ["gb", "GBP"],
  ])("%s → %s", (country, ccy) => expect(currencyForCountry(country, ALL)).toBe(ccy));

  it("falls back to USD when the mapped currency is disabled", () => {
    expect(currencyForCountry("GB", ["USD", "EUR"])).toBe("USD");
  });
});

describe("applyRounding", () => {
  it("cents", () => expect(applyRounding(12.345, "cents")).toBe(12.35));
  it("end_99 rounds up to .99", () => {
    expect(applyRounding(12.2, "end_99")).toBe(12.99);
    expect(applyRounding(12.99, "end_99")).toBe(12.99);
    expect(applyRounding(13, "end_99")).toBe(13.99);
  });
  it("whole rounds up", () => expect(applyRounding(12.01, "whole")).toBe(13));
  it("never rounds sub-1 amounts beyond cents", () => expect(applyRounding(0.456, "end_99")).toBe(0.46));
});

describe("convert + format for US / UK / UAE visitors", () => {
  it("USD", () => expect(formatMoney(convertFromUsd(49, { rate_to_usd: 1, rounding_rule: "cents" }), "USD")).toBe("$49.00"));
  it("GBP", () => expect(formatMoney(convertFromUsd(49, { rate_to_usd: 0.78, rounding_rule: "cents" }), "GBP")).toBe("£38.22"));
  it("AED", () => expect(formatMoney(convertFromUsd(49, { rate_to_usd: 3.6725, rounding_rule: "cents" }), "AED")).toMatch(/^AED\s?179\.95$/));
  it("EUR uses a decimal point in en-IE", () => expect(formatMoney(10.5, "EUR")).toBe("€10.50"));
  it("shows 3 decimals for sub-unit per-1000 rates", () => expect(formatMoney(0.45, "USD")).toBe("$0.45"));
});

describe("seed honesty", () => {
  it("package compare-at price equals the real sum of its items bought separately", () => {
    for (const p of packages) {
      const sum = p.items.reduce((acc, it) => {
        const s = services.find((x) => x.id === it.service_id)!;
        return acc + (s.price_per_1000_usd * it.qty) / 1000;
      }, 0);
      expect(p.compare_at_price_usd, p.slug).toBeCloseTo(Math.round(sum * 100) / 100, 2);
      expect(p.price_usd, p.slug).toBeLessThanOrEqual(sum);
    }
  });
  it("every service has a delivery method and no unverified 'real' claim", () => {
    for (const s of services) {
      expect(s.delivery_method.trim().length).toBeGreaterThan(0);
      if (!s.is_real_engagement_verified) expect(`${s.name} ${s.description}`).not.toMatch(/\breal\b/i);
    }
  });
});
