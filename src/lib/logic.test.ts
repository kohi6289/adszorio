import { toCsv } from "./admin/csv";
import { describe, expect, it } from "vitest";
import { validateLink } from "./links";
import { checkQuantity, deliveryEstimate, serviceTotalUsd } from "./pricing";
import { riskFlags } from "./risk";
import { renderMarkdown } from "./markdown";

describe("validateLink", () => {
  it.each([
    ["profile", "instagram.com/some.user_1"],
    ["profile", "https://www.instagram.com/brand/"],
    ["post", "https://instagram.com/p/C1a2b3c4"],
    ["post", "https://instagr.am/p/C1a2b3c4"],
    ["reel", "https://www.instagram.com/reel/C1a2b3c4/?igsh=abc"],
    ["video", "https://youtube.com/watch?v=dQw4w9WgXcQ"],
    ["video", "https://youtu.be/dQw4w9WgXcQ"],
    ["video", "https://www.youtube.com/shorts/abc123"],
    ["short", "https://youtube.com/shorts/abc123"],
    ["channel", "https://youtube.com/@creator"],
    ["channel", "https://www.youtube.com/channel/UC123abc"],
  ] as const)("accepts %s %s", (type, url) => expect(validateLink(type, url).ok).toBe(true));

  it.each([
    ["profile", "https://instagram.com/p/C1a2b3c4"],
    ["profile", "https://tiktok.com/@x"],
    ["post", "https://instagram.com/someuser"],
    ["video", "https://youtube.com/@creator"],
    ["short", "https://youtube.com/watch?v=abc"],
    ["channel", "https://youtube.com/watch?v=abc"],
    ["video", "not a url at all"],
    ["video", ""],
  ] as const)("rejects %s %s", (type, url) => expect(validateLink(type, url).ok).toBe(false));

  it("normalises to https and drops the hash", () => {
    const r = validateLink("video", "http://youtube.com/watch?v=abc123#t=1");
    expect(r.ok && r.url).toBe("https://youtube.com/watch?v=abc123");
  });
});

describe("pricing", () => {
  it("computes per-1000 totals in USD", () => expect(serviceTotalUsd({ price_per_1000_usd: 1.9 }, 5000)).toBe(9.5));
  it("enforces min/max", () => {
    expect(checkQuantity({ min_qty: 100, max_qty: 1000 }, 99).ok).toBe(false);
    expect(checkQuantity({ min_qty: 100, max_qty: 1000 }, 1001).ok).toBe(false);
    expect(checkQuantity({ min_qty: 100, max_qty: 1000 }, 100.5).ok).toBe(false);
    expect(checkQuantity({ min_qty: 100, max_qty: 1000 }, 500).ok).toBe(true);
  });
  it("estimates delivery", () => expect(deliveryEstimate({ start_time_hours_max: 12, speed_per_day: 1000 }, 2500)).toEqual({ startHours: 12, days: 3 }));
});

describe("riskFlags", () => {
  const base = { email: "a@gmail.com", country: "US", ipCountry: "US", amountUsd: 20, previousOrders: 0, ordersToday: 0, firstOrderMaxUsd: 250 };
  it("clean order", () => expect(riskFlags(base)).toEqual([]));
  it("flags each risk", () => {
    expect(riskFlags({ ...base, email: "x@mailinator.com" })).toContain("disposable_email");
    expect(riskFlags({ ...base, ipCountry: "NG" })).toContain("ip_country_mismatch");
    expect(riskFlags({ ...base, amountUsd: 900 })).toContain("high_first_order");
    expect(riskFlags({ ...base, amountUsd: 900, previousOrders: 2 })).not.toContain("high_first_order");
    expect(riskFlags({ ...base, ordersToday: 5 })).toContain("repeat_orders_today");
  });
});

describe("renderMarkdown", () => {
  it("escapes HTML", () => expect(renderMarkdown("<script>alert(1)</script>")).not.toContain("<script>"));
  it("renders headings, lists, bold and safe links", () => {
    const html = renderMarkdown("## Title\n\n- one\n- **two**\n\n[site](https://adszorio.com) [bad](javascript:alert(1))");
    expect(html).toContain("<h2");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<strong>two</strong>");
    expect(html).toContain('href="https://adszorio.com"');
    expect(html).not.toContain("javascript:");
  });
});

describe("toCsv", () => {
  it("quotes and neutralises formulas", () => {
    expect(toCsv([{ a: 'x,"y"', b: "=SUM(A1)" }], ["a", "b"])).toBe('a,b\r\n"x,""y""",\'=SUM(A1)');
  });
});
