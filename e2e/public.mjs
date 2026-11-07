// End-to-end checks in headless Chrome (macOS Chrome path). Run against a fresh DB: pnpm db:reset && pnpm admin:create owner@adszorio.local 'LocalAdmin#2026'
// Usage: node e2e/<file>.mjs [baseUrl]   (default http://localhost:3000)
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000";
const CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const chrome = spawn(CH, ["--headless=new", `--user-data-dir=${mkdtempSync(join(tmpdir(), "e2e-"))}`, "--remote-debugging-port=9334", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) { try { targets = await (await fetch("http://127.0.0.1:9334/json/list")).json(); break; } catch { await sleep(200); } }
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
const waitFor = async (expr, ms = 20000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await ev(expr)) return true; } catch {} await sleep(200); } throw new Error(`Timeout waiting for: ${expr}`); };
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

const email = `e2e+${Date.now()}@gmail.com`;
let code = "";

await step("order wizard: validation blocks bad link", async () => {
  await go("/order?service=youtube-views-standard&qty=2000");
  await clickText("button", "Continue");
  await waitFor(`document.querySelector('#o-link-video') && !document.querySelector('#o-link-video').closest('section').hidden`);
  await type("#o-link-video", "https://instagram.com/p/abc");
  await clickText("button", "Continue");
  await waitFor(`document.body.innerText.includes('Please paste a YouTube video link')`);
});
await step("order wizard: full submit", async () => {
  await type("#o-link-video", "https://youtu.be/dQw4w9WgXcQ");
  await clickText("button", "Continue");
  await waitFor(`!document.querySelector('#o-name').closest('section').hidden`);
  await type("#o-name", "E2E Tester"); await type("#o-email", email); await type("#o-country", "GB"); await type("#o-phone", "+44 7700 900123");
  await click("input[name=terms]");
  await clickText("button", "Continue");
  await waitFor(`document.body.innerText.includes('Review your order')`);
  await clickText("button", "Place order");
  // fictional UK number (07700 900xxx is reserved) must be rejected server-side and jump back to step 3
  await waitFor(`document.body.innerText.includes("doesn't look valid")`, 30000);
  await type("#o-phone", "+44 7911 123456");
  await clickText("button", "Continue");
  await waitFor(`document.body.innerText.includes('Review your order')`);
  await clickText("button", "Place order");
  await waitFor(`location.pathname === '/order/confirmed'`, 30000);
  await waitFor(`/ADZ-\\d+/.test(document.body.innerText)`);
  code = (await text()).match(/ADZ-\d+/)[0];
  if (!(await text()).includes("2,000 × YouTube Views")) throw new Error("summary missing item");
});
await step("track order", async () => {
  await go(`/track?code=${code}`);
  await type("#t-email", email);
  await clickText("button", "Track");
  await waitFor(`document.body.innerText.includes('Timeline')`);
  if (!(await text()).includes("Order placed")) throw new Error("timeline missing");
});
await step("track: wrong email gives generic error", async () => {
  await go(`/track?code=${code}`);
  await type("#t-email", "someone-else@gmail.com");
  await clickText("button", "Track");
  await waitFor(`document.body.innerText.includes("couldn't find an order")`);
});
await step("contact lead form", async () => {
  await go("/contact");
  await clickText("button", "Send message");
  await waitFor(`document.body.innerText.includes('Please enter your name')`);
  await type("#l-name", "Agency Person"); await type("#l-email", "agency@example.org"); await type("#l-company", "Acme Media");
  await type("#l-message", "We need 500k reels views per month for 10 clients.");
  await clickText("button", "Send message");
  await waitFor(`document.body.innerText.includes("got your message")`);
});
await step("privacy request form", async () => {
  await go("/privacy/request");
  await click("input[name=type][value=export]"); await type("#r-email", email);
  await clickText("button", "Submit request");
  await waitFor(`document.body.innerText.includes('Request received')`);
});
await step("admin login", async () => {
  await go("/admin");
  await waitFor(`location.pathname === '/admin/login'`);
  await type("#a-email", "owner@adszorio.local"); await type("#a-pass", "LocalAdmin#2026");
  await clickText("button", "Sign in");
  await waitFor(`location.pathname === '/admin' && document.body.innerText.includes('Orders today')`, 30000);
});
await step("admin: order visible and status change emails + logs", async () => {
  await go(`/admin/orders?q=${code}`);
  await waitFor(`document.body.innerText.includes('${code}')`);
  await ev(`[...document.querySelectorAll('a')].find(a => a.textContent.includes('${code}') && a.offsetParent).click()`);
  await waitFor(`document.body.innerText.includes('Change status')`);
  await type("select[name=status]", "processing");
  await type("input[name=note]", "Started delivery");
  await clickText("button", "Update status");
  await waitFor(`document.body.innerText.includes('Status set to Processing')`);
});
await step("customer sees new status", async () => {
  await go(`/track?code=${code}`);
  await type("#t-email", email);
  await clickText("button", "Track");
  await waitFor(`document.body.innerText.includes('Started delivery')`);
});
await step("admin: leads board shows lead", async () => {
  await go("/admin/leads");
  await waitFor(`document.body.innerText.includes('Agency Person')`);
});
await step("admin: privacy requests listed", async () => {
  await go("/admin/data_requests");
  await waitFor(`document.body.innerText.includes('${email}')`);
});

console.log(results.join("\n"));
console.log("ORDER", code);
console.log("CONSOLE ERRORS", consoleErrors.length ? consoleErrors.slice(0, 10) : "none");
ws.close(); chrome.kill();
