"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/actions-util";
import { audit, requireAdmin } from "./auth";
import { resourceByKey, type ResourceDef } from "./resources";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function def(key: string): ResourceDef {
  const r = resourceByKey(key);
  if (!r) throw new Error(`Unknown resource ${key}`);
  return r;
}

type Db = Awaited<ReturnType<typeof requireAdmin>>["db"];

async function uploadImage(db: Db, folder: string, file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be 5 MB or smaller.");
  if (!/^image\/(png|jpeg|webp|avif|svg\+xml)$/.test(file.type)) throw new Error("Use a PNG, JPG, WebP, AVIF or SVG image.");
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "img";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from("public-media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return db.storage.from("public-media").getPublicUrl(path).data.publicUrl;
}

/** Turns form values into a DB row according to the field definitions. */
async function parseFields(db: Db, r: ResourceDef, fd: FormData, isNew: boolean) {
  const row: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  const text = (n: string) => String(fd.get(n) ?? "").trim();

  for (const f of r.fields) {
    if (f.readonly || (f.createOnly && !isNew)) continue;
    const v = text(f.name);
    const req = (ok: boolean) => { if (f.required && !ok) errors[f.name] = `${f.label} is required.`; };
    switch (f.type) {
      case "boolean":
        row[f.name] = fd.get(f.name) === "on";
        break;
      case "number": {
        req(v !== "");
        if (v === "") { row[f.name] = null; break; }
        const n = Number(v);
        if (!Number.isFinite(n)) errors[f.name] = "Enter a number.";
        else if (f.min !== undefined && n < f.min) errors[f.name] = `Must be at least ${f.min}.`;
        else if (f.max !== undefined && n > f.max) errors[f.name] = `Must be at most ${f.max}.`;
        else if (f.step === "1" && !Number.isInteger(n)) errors[f.name] = "Use a whole number.";
        row[f.name] = n;
        break;
      }
      case "slug":
        req(v !== "");
        if (v && !SLUG.test(v)) errors[f.name] = "Use lowercase letters, numbers and single hyphens only.";
        row[f.name] = v;
        break;
      case "ref":
        req(v !== "");
        if (v && !UUID.test(v)) errors[f.name] = "Choose an option.";
        row[f.name] = v || null;
        break;
      case "lines":
        row[f.name] = v.split("\n").map((s) => s.trim()).filter(Boolean);
        break;
      case "csv": {
        const list = v.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
        if (list.some((c) => !/^[A-Z]{2}$/.test(c))) errors[f.name] = "Use 2-letter country codes separated by commas.";
        row[f.name] = list.length ? list : null;
        break;
      }
      case "datetime":
        row[f.name] = v ? new Date(`${v}Z`).toISOString() : null; // inputs are in UTC
        break;
      case "color":
        req(v !== "");
        if (v && !/^#[0-9a-fA-F]{6}$/.test(v)) errors[f.name] = "Use a hex colour like #D1121B.";
        row[f.name] = v.toUpperCase();
        break;
      case "image": {
        const file = fd.get(`${f.name}__file`);
        if (file instanceof File && file.size > 0) {
          try { row[f.name] = await uploadImage(db, r.table, file); } catch (e) { errors[f.name] = (e as Error).message; }
        } else {
          row[f.name] = v || null;
        }
        break;
      }
      case "package-items": {
        try {
          const items = JSON.parse(v || "[]") as { service_id: string; qty: number }[];
          const clean = items.filter((i) => UUID.test(i.service_id) && Number.isInteger(i.qty) && i.qty > 0);
          if (clean.length !== items.length) errors[f.name] = "Each item needs a service and a whole-number quantity.";
          if (f.required && clean.length === 0) errors[f.name] = "Add at least one service.";
          row[f.name] = clean;
        } catch {
          errors[f.name] = "Invalid items.";
        }
        break;
      }
      default:
        req(v !== "");
        // Markdown columns are NOT NULL with '' default; other optional text becomes NULL.
        row[f.name] = v || (f.required || f.type === "markdown" ? "" : null);
    }
  }
  return { row, errors };
}

/** Business rules that go beyond single-field checks. */
async function crossChecks(db: Db, r: ResourceDef, row: Record<string, unknown>, errors: Record<string, string>) {
  if (r.key === "services") {
    if (Number(row.max_qty) < Number(row.min_qty)) errors.max_qty = "Maximum must be at least the minimum.";
    const claimsReal = /\breal\b/i.test(`${row.name ?? ""} ${row.description ?? ""}`);
    if (claimsReal && !row.is_real_engagement_verified) {
      errors.is_real_engagement_verified = "The name or description says “real”. Only allowed if you have verified it and tick this box.";
    }
  }
  if (r.key === "packages" && Array.isArray(row.items) && row.items.length) {
    const ids = (row.items as { service_id: string }[]).map((i) => i.service_id);
    const { data } = await db.from("services").select("id, price_per_1000_usd").in("id", ids);
    const price = new Map((data ?? []).map((s) => [s.id, Number(s.price_per_1000_usd)]));
    const separate = Math.round((row.items as { service_id: string; qty: number }[]).reduce((a, i) => a + ((price.get(i.service_id) ?? 0) * i.qty) / 1000, 0) * 100) / 100;
    if (row.compare_at_price_usd === null || row.compare_at_price_usd === undefined) row.compare_at_price_usd = separate;
    if (Number(row.compare_at_price_usd) > separate + 0.01) {
      errors.compare_at_price_usd = `Can't be more than the real separate price (${separate.toFixed(2)}).`;
    }
    if (Number(row.price_usd) > Number(row.compare_at_price_usd)) errors.price_usd = "Package price is higher than the compare-at price.";
  }
  if (r.key === "currencies" && row.code !== undefined) {
    row.code = String(row.code).toUpperCase();
    if (!/^[A-Z]{3}$/.test(String(row.code))) errors.code = "Use a 3-letter ISO code, e.g. SGD.";
  }
  if (r.key === "data_requests" && row.status === "completed") row.completed_at = new Date().toISOString();
}

export async function saveRecord(key: string, id: string | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const { db, user } = await requireAdmin();
  const r = def(key);
  const isNew = !id;
  const { row, errors } = await parseFields(db, r, fd, isNew);
  await crossChecks(db, r, row, errors);
  if (Object.keys(errors).length) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: errors };

  let savedId = id;
  if (isNew) {
    if (r.sortable) {
      const { data } = await db.from(r.table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
      row.sort_order = ((data?.[0]?.sort_order as number) ?? 0) + 1;
    }
    const { data, error } = await db.from(r.table).insert(row).select(r.pk).single();
    if (error) return { status: "error", message: friendly(error.message) };
    savedId = String((data as unknown as Record<string, unknown>)[r.pk]);
    await audit(db, user.id, "create", r.table, savedId, row);
  } else {
    const { data: before } = await db.from(r.table).select("*").eq(r.pk, id).single();
    if (r.key === "legal_pages" && before && before.body !== row.body) row.version = Number(before.version) + 1;
    const { error } = await db.from(r.table).update(row).eq(r.pk, id);
    if (error) return { status: "error", message: friendly(error.message) };
    const diff = Object.fromEntries(Object.entries(row).filter(([k, v]) => JSON.stringify(before?.[k]) !== JSON.stringify(v)).map(([k, v]) => [k, { from: before?.[k], to: v }]));
    await audit(db, user.id, "update", r.table, id, diff);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/${key}?saved=${encodeURIComponent(String(row[r.titleField] ?? savedId))}`);
}

function friendly(msg: string) {
  if (/duplicate key/.test(msg)) return "Something with that slug or code already exists. Use a different one.";
  if (/foreign key/.test(msg)) return "This is still used elsewhere (e.g. services in a category, or orders). Hide it instead of deleting.";
  if (/violates check constraint/.test(msg)) return "One of the values isn't allowed. Please check the fields.";
  if (/violates not-null constraint/.test(msg)) return "A required value is missing. Please fill in all fields marked *.";
  return msg;
}

export async function deleteRecord(key: string, id: string) {
  const { db, user } = await requireAdmin();
  const r = def(key);
  if (!r.canDelete) throw new Error("Not deletable");
  const { error } = await db.from(r.table).delete().eq(r.pk, id);
  if (error) redirect(`/admin/${key}?error=${encodeURIComponent(friendly(error.message))}`);
  await audit(db, user.id, "delete", r.table, id);
  revalidatePath("/", "layout");
  redirect(`/admin/${key}?saved=deleted`);
}

export async function toggleRecord(key: string, id: string, field: string) {
  const { db, user } = await requireAdmin();
  const r = def(key);
  if (!r.toggles?.includes(field)) throw new Error("Not toggleable");
  const { data } = await db.from(r.table).select(field).eq(r.pk, id).single();
  const next = !(data as unknown as Record<string, boolean> | null)?.[field];
  await db.from(r.table).update({ [field]: next }).eq(r.pk, id);
  await audit(db, user.id, "toggle", r.table, id, { [field]: next });
  revalidatePath("/", "layout");
}

export async function moveRecord(key: string, id: string, dir: "up" | "down") {
  const { db, user } = await requireAdmin();
  const r = def(key);
  if (!r.sortable) return;
  const { data } = await db.from(r.table).select(`${r.pk}, sort_order`).order("sort_order", { ascending: true });
  const rows = (data ?? []) as unknown as Record<string, string | number>[];
  const i = rows.findIndex((x) => String(x[r.pk]) === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  // Renumber everything so duplicates/gaps from earlier edits are fixed too.
  await Promise.all(rows.map((x, idx) => db.from(r.table).update({ sort_order: idx + 1 }).eq(r.pk, x[r.pk])));
  await audit(db, user.id, "reorder", r.table, id, { dir });
  revalidatePath("/", "layout");
}

export async function duplicateRecord(key: string, id: string) {
  const { db, user } = await requireAdmin();
  const r = def(key);
  if (!r.canDuplicate) return;
  const { data } = await db.from(r.table).select("*").eq(r.pk, id).single();
  if (!data) return;
  const copy = { ...(data as Record<string, unknown>) };
  delete copy.id;
  delete copy.created_at;
  delete copy.updated_at;
  copy.name = `${copy.name} (copy)`;
  copy.slug = `${copy.slug}-copy-${Math.random().toString(36).slice(2, 6)}`;
  copy.is_active = false;
  copy.sort_order = Number(copy.sort_order) + 1;
  const { data: created, error } = await db.from(r.table).insert(copy).select("id").single();
  if (error) redirect(`/admin/${key}?error=${encodeURIComponent(friendly(error.message))}`);
  await audit(db, user.id, "duplicate", r.table, created!.id, { from: id });
  revalidatePath("/", "layout");
  redirect(`/admin/${key}/${created!.id}`);
}

