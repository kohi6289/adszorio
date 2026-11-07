// End-to-end checks in headless Chrome (macOS Chrome path). Run against a fresh DB: pnpm db:reset && pnpm admin:create owner@adszorio.local 'LocalAdmin#2026'
// Usage: node e2e/<file>.mjs [baseUrl]   (default http://localhost:3000)
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000";
const CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chrome = spawn(CH, ["--headless=new", `--user-data-dir=${mkdtempSync(join(tmpdir(), "e2e-"))}`, "--remote-debugging-port=9338", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) { try { targets = await (await fetch("http://127.0.0.1:9338/json/list")).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let n = 0; const pending = new Map(); const consoleErrors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? { error: m.error }); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") consoleErrors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") consoleErrors.push(m.params.args.map((a) => a.value ?? a.description).join(" "));
};
const send = (method, params = {}) => new Promise((r) => { const id = ++n; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
await send("Runtime.enable"); await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

const ev = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "eval failed"); return r.result?.value; };
const go = async (path) => { await send("Page.navigate", { url: BASE + path }); await waitFor("document.readyState === 'complete'"); await sleep(600); };
const waitFor = async (expr, ms = 20000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await ev(`!!(${expr})`)) return true; } catch {} await sleep(200); } throw new Error(`Timeout waiting for: ${expr}`); };
// React-friendly value setter
const type = (sel, value) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('no ' + ${JSON.stringify(sel)});
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
const click = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('no ' + ${JSON.stringify(sel)}); el.click(); return true; })()`);
const clickText = (tag, text) => ev(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(tag)})].find(e => e.textContent.trim().startsWith(${JSON.stringify(text)}) && e.offsetParent !== null); if (!el) throw new Error('no ${tag} "${text}"'); el.click(); return true; })()`);
const text = () => ev("document.body.innerText");
const results = [];
const step = async (name, fn) => { try { await fn(); results.push(`PASS ${name}`); } catch (e) { results.push(`FAIL ${name}: ${e.message}`); } };


const login = async () => {
  await go("/admin/login");
  await type("#a-email", "owner@adszorio.local"); await type("#a-pass", "LocalAdmin#2026");
  await clickText("button", "Sign in");
  await waitFor(`location.pathname === '/admin'`, 30000);
};
const submitForm = () => ev(`document.querySelector('main form:not([role=search]) button[type=submit]').click()`);


const PUBLIC = ["/", "/services", "/youtube", "/instagram", "/tiktok", "/youtube/youtube-views-standard", "/instagram/instagram-followers-standard", "/packages", "/packages/instagram-creator", "/faq", "/legal/terms", "/contact", "/track", "/order", "/order?package=youtube-growth", "/privacy/request", "/privacy/do-not-sell", "/nope-404"];
const ADMIN = ["/admin", "/admin/orders", "/admin/leads", "/admin/services", "/admin/services/00000000-0000-4000-8000-000000001001", "/admin/packages/00000000-0000-4000-8000-000000003002", "/admin/currencies", "/admin/banners/new", "/admin/legal_pages", "/admin/settings", "/admin/bulk-price?percent=5", "/admin/audit", "/admin/data_requests", "/admin/faqs"];
const probe = `(() => {
  const vw = innerWidth;
  const over = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); if (!r.width) return false; let p = e.parentElement; while (p) { const cs = getComputedStyle(p); if (/(auto|scroll|hidden)/.test(cs.overflowX)) return false; p = p.parentElement; } return r.right > vw + 1; }).slice(0, 3).map(e => e.tagName + '.' + String(e.className).slice(0, 40));
  const small = [...document.querySelectorAll('a,button,select,input:not([type=hidden]),[role=switch],summary')].filter(e => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; if (getComputedStyle(e).position === 'absolute' && r.width <= 1) return false; if (e.closest('p,li p,dd') && e.tagName === 'A' && r.height >= 16) return false; return r.height < 24 || r.width < 24; }).filter(e => !e.closest('.sr-only') && e.textContent.trim() !== 'Skip to content').slice(0, 4).map(e => (e.textContent.trim() || e.getAttribute('aria-label') || e.name || e.tagName).slice(0, 24) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  return { scrollW: document.documentElement.scrollWidth, over, small };
})()`;
const report = [];
const check = async (path, w) => {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 768 });
  await go(path); await sleep(400);
  const r = await ev(probe);
  const bad = r.scrollW > w || r.over.length || r.small.length;
  report.push(`${bad ? "WARN" : "ok  "} ${String(w).padEnd(4)} ${path}${r.scrollW > w ? ` scrollW=${r.scrollW}` : ""}${r.over.length ? ` over=${r.over.join(",")}` : ""}${r.small.length ? ` small=${r.small.join(" | ")}` : ""}`);
};
for (const p of PUBLIC) for (const w of [360, 768, 1280]) await check(p, w);
await login();
for (const p of ADMIN) await check(p, 360);
for (const p of ["/admin", "/admin/orders", "/admin/services"]) await check(p, 1280);
console.log(report.join("\n"));
ws.close(); chrome.kill();
