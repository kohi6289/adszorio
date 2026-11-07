// End-to-end checks in headless Chrome (macOS Chrome path). Run against a fresh DB: pnpm db:reset && pnpm admin:create owner@adszorio.local 'LocalAdmin#2026'
// Usage: node e2e/<file>.mjs [baseUrl]   (default http://localhost:3000)
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000";
const CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chrome = spawn(CH, ["--headless=new", `--user-data-dir=${mkdtempSync(join(tmpdir(), "e2e-"))}`, "--remote-debugging-port=9335", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) { try { targets = await (await fetch("http://127.0.0.1:9335/json/list")).json(); break; } catch { await sleep(200); } }
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

await step("login", login);
await step("edit service price -> public page shows it", async () => {
  await go("/admin/services?q=Instagram%20Likes");
  await ev(`[...document.querySelectorAll('main a')].find(a => a.textContent.trim() === 'Instagram Likes' && a.offsetParent).click()`);
  await waitFor(`document.querySelector('#f-price_per_1000_usd')`);
  await type("#f-price_per_1000_usd", "2.15");
  await submitForm();
  await waitFor(`document.body.innerText.includes('Saved')`);
  await go("/instagram/instagram-likes");
  await waitFor(`document.body.innerText.includes('$2.15')`);
});
await step("service 'real' wording is blocked unless verified", async () => {
  await go("/admin/services?q=Instagram%20Saves");
  await ev(`[...document.querySelectorAll('main a')].find(a => a.textContent.trim() === 'Instagram Saves' && a.offsetParent).click()`);
  await waitFor(`document.querySelector('#f-name')`);
  await type("#f-name", "Instagram Real Saves");
  await submitForm();
  await waitFor(`document.body.innerText.includes('Only allowed if you have verified')`);
  if ((await ev(`document.querySelector('#f-name').value`)) !== "Instagram Real Saves") throw new Error("form lost input after error");
});
await step("create TikTok platform + category + service -> /tiktok live", async () => {
  await go("/admin/platforms/new");
  await type("#f-name", "TikTok"); await type("#f-slug", "tiktok"); await type("#f-brand_color", "#00A8A8");
  await submitForm(); await waitFor(`document.body.innerText.includes('Saved')`);
  await go("/admin/categories/new");
  await waitFor(`document.querySelector('#f-platform_id')`);
  await ev(`(() => { const s = document.querySelector('#f-platform_id'); const o = [...s.options].find(o => o.text === 'TikTok'); s.value = o.value; s.dispatchEvent(new Event('change', {bubbles:true})); })()`);
  await type("#f-name", "Followers"); await type("#f-slug", "followers");
  await submitForm(); await waitFor(`document.body.innerText.includes('Saved')`);
  await go("/admin/services/new");
  await waitFor(`document.querySelector('#f-category_id')`);
  await ev(`(() => { const s = document.querySelector('#f-category_id'); const o = [...s.options].find(o => o.text === 'TikTok · Followers'); s.value = o.value; s.dispatchEvent(new Event('change', {bubbles:true})); })()`);
  await type("#f-name", "TikTok Followers"); await type("#f-slug", "tiktok-followers"); await type("#f-price_per_1000_usd", "3.5");
  await type("#f-link_type", "profile");
  await type("#f-delivery_method", "Delivered gradually through third-party suppliers; may drop over time.");
  await submitForm(); await waitFor(`document.body.innerText.includes('Saved')`);
  await go("/tiktok");
  await waitFor(`document.body.innerText.includes('TikTok Followers')`);
  if (!(await ev(`[...document.querySelectorAll('header a')].some(a => a.getAttribute('href') === '/tiktok')`)) && !(await ev(`[...document.querySelectorAll('a')].some(a => a.getAttribute('href') === '/tiktok')`))) throw new Error("no nav link");
});
await step("settings: WhatsApp + stats show on site", async () => {
  await go("/admin/settings");
  await type("#s-whatsapp", "+919812345678");
  await type("#s-stats", "Orders delivered | 1250");
  await ev(`document.querySelector('main form button[type=submit]').click()`);
  await waitFor(`document.body.innerText.includes('Settings saved')`);
  await go("/");
  await waitFor(`document.body.innerText.includes('Orders delivered')`);
  if (!(await ev(`[...document.querySelectorAll('a')].some(a => a.href.startsWith('https://wa.me/919812345678'))`))) throw new Error("no WhatsApp link");
});
await step("package compare-at can't exceed real price", async () => {
  await go("/admin/packages?q=YouTube%20Starter");
  await ev(`[...document.querySelectorAll('main a')].find(a => a.textContent.trim() === 'YouTube Starter' && a.offsetParent).click()`);
  await waitFor(`document.querySelector('#f-compare_at_price_usd')`);
  await type("#f-compare_at_price_usd", "99");
  await submitForm();
  await waitFor(`document.body.innerText.includes("Can't be more than the real separate price")`);
});
await step("bulk price: preview then apply +10% to TikTok", async () => {
  await go("/admin/bulk-price");
  await ev(`(() => { const s = document.querySelector('select[name=platform]'); s.value = [...s.options].find(o => o.text === 'TikTok').value; })()`);
  await type("input[name=percent]", "10");
  await clickText("button", "Preview");
  await waitFor(`document.body.innerText.includes('$3.8500')`);
  await clickText("button", "Apply");
  await waitFor(`document.body.innerText.includes('Updated 1 service prices')`);
});
await step("audit log records changes", async () => {
  await go("/admin/audit");
  await waitFor(`document.body.innerText.includes('services.bulk_price') && document.body.innerText.includes('settings.update')`);
});
await step("dashboard + mobile admin renders without overflow", async () => {
  await go("/admin");
  await waitFor(`document.body.innerText.includes('Orders today')`);
  const sw = await ev("document.documentElement.scrollWidth"); if (sw > 390) throw new Error("horizontal overflow " + sw);
});
await step("sign out protects admin", async () => {
  await ev(`[...document.querySelectorAll('header button')].find(b => b.getAttribute('aria-label') === 'Open admin menu').click()`);
  await sleep(500);
  await clickText("button", "Sign out");
  await waitFor(`location.pathname === '/admin/login'`);
  await go("/admin/orders");
  await waitFor(`location.pathname === '/admin/login'`);
});

console.log(results.join("\n"));
console.log("CONSOLE ERRORS", consoleErrors.length ? consoleErrors.slice(0, 10) : "none");
ws.close(); chrome.kill();
