"use client";

import { Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input, Select, Textarea } from "@/components/ui/form";
import type { ActionState } from "@/lib/actions-util";
import { saveRecord } from "@/lib/admin/resource-actions";
import type { FieldDef } from "@/lib/admin/resources";
import { cn } from "@/lib/utils";

export interface RefOption { value: string; label: string; meta?: string }

const toLocalInput = (iso: unknown) => (typeof iso === "string" && iso ? iso.slice(0, 16) : ""); // UTC wall time

export function ResourceForm({
  resourceKey, id, fields, record, refs, submitLabel,
}: {
  resourceKey: string;
  id: string | null;
  fields: FieldDef[];
  record: Record<string, unknown>;
  refs: Record<string, RefOption[]>;
  submitLabel: string;
}) {
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(saveRecord.bind(null, resourceKey, id), { status: "idle" });
  const fe = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form
      noValidate
      // onSubmit (not action=) so React doesn't reset the inputs when the server returns validation errors.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => dispatch(fd));
      }}
      className="grid gap-5 rounded-lg border border-border bg-surface p-4 md:grid-cols-2 md:p-6"
    >
      {state.status === "error" && <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger md:col-span-2">{state.message}</p>}
      {fields.map((f) => (
        <FieldControl key={f.name} f={f} value={record[f.name]} error={fe[f.name]} refs={refs} isNew={!id} />
      ))}
      <div className="flex gap-2 border-t border-border pt-4 md:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}

function FieldControl({ f, value, error, refs, isNew }: { f: FieldDef; value: unknown; error?: string; refs: Record<string, RefOption[]>; isNew: boolean }) {
  const id = `f-${f.name}`;
  const wide = f.wide || ["markdown", "textarea", "package-items", "lines"].includes(f.type);
  const readOnly = f.readonly || (f.createOnly && !isNew);
  const common = { id, name: f.name, ...describedBy(id, error) };

  if (f.type === "boolean") {
    return (
      <div className={cn(wide && "md:col-span-2")}>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" name={f.name} defaultChecked={Boolean(value)} className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]" aria-describedby={error ? `${id}-error` : `${id}-hint`} />
          <span><span className="font-semibold text-fg">{f.label}</span>{f.help && <span id={`${id}-hint`} className="block text-fg-muted">{f.help}</span>}</span>
        </label>
        {error && <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-medium text-danger">{error}</p>}
      </div>
    );
  }

  let control: React.ReactNode;
  switch (f.type) {
    case "textarea":
      control = <Textarea {...common} rows={4} defaultValue={String(value ?? "")} readOnly={readOnly} />;
      break;
    case "markdown":
      control = <Textarea {...common} rows={f.name === "body" ? 22 : 6} defaultValue={String(value ?? "")} className="font-mono text-sm" />;
      break;
    case "lines":
      control = <Textarea {...common} rows={4} defaultValue={Array.isArray(value) ? value.join("\n") : ""} />;
      break;
    case "csv":
      control = <Input {...common} defaultValue={Array.isArray(value) ? value.join(", ") : ""} />;
      break;
    case "number":
      control = <Input {...common} type="number" inputMode="decimal" step={f.step ?? "any"} min={f.min} max={f.max} defaultValue={value === null || value === undefined ? "" : String(value)} className="font-mono" />;
      break;
    case "select":
      control = (
        <Select {...common} defaultValue={String(value ?? f.options?.[0] ?? "")}>
          {f.options?.map((o) => <option key={o} value={o}>{o.replaceAll("_", " ")}</option>)}
        </Select>
      );
      break;
    case "ref":
      control = (
        <Select {...common} defaultValue={String(value ?? "")}>
          <option value="">{f.required ? "Choose…" : "None"}</option>
          {(refs[f.ref!] ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      );
      break;
    case "datetime":
      control = <Input {...common} type="datetime-local" defaultValue={toLocalInput(value)} />;
      break;
    case "color":
      control = <ColorInput common={common} value={String(value ?? "#14161A")} />;
      break;
    case "image":
      control = <ImageInput name={f.name} id={id} value={typeof value === "string" ? value : ""} />;
      break;
    case "package-items":
      control = <PackageItems name={f.name} value={Array.isArray(value) ? (value as { service_id: string; qty: number }[]) : []} services={refs.services ?? []} />;
      break;
    default:
      control = <Input {...common} defaultValue={String(value ?? "")} readOnly={readOnly} className={cn(f.type === "slug" && "font-mono", readOnly && "bg-surface-2")} />;
  }

  return (
    <Field id={id} label={<>{f.label}{f.required && <span aria-hidden className="text-danger"> *</span>}</>} hint={f.type === "datetime" ? `${f.help ? `${f.help} ` : ""}Time is in UTC.` : f.help} error={error} className={cn(wide && "md:col-span-2")}>
      {control}
    </Field>
  );
}

function ColorInput({ common, value }: { common: Record<string, unknown>; value: string }) {
  const [v, setV] = useState(value);
  return (
    <div className="flex items-center gap-2">
      <input type="color" aria-label="Pick colour" value={/^#[0-9a-f]{6}$/i.test(v) ? v : "#000000"} onChange={(e) => setV(e.target.value.toUpperCase())} className="h-12 w-14 cursor-pointer rounded-md border border-border-strong bg-surface p-1" />
      <Input {...common} value={v} onChange={(e) => setV(e.target.value)} className="font-mono" />
    </div>
  );
}

function ImageInput({ name, id, value }: { name: string; id: string; value: string }) {
  const [url, setUrl] = useState(value);
  return (
    <div className="grid gap-2">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-28 w-auto max-w-full rounded-md border border-border object-contain" />
      )}
      <Input id={id} name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… or upload below" />
      <input type="file" name={`${name}__file`} accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml" aria-label="Upload image" className="text-sm file:mr-3 file:min-h-10 file:cursor-pointer file:rounded-md file:border file:border-border-strong file:bg-surface-2 file:px-3 file:text-sm file:font-semibold" />
    </div>
  );
}

function PackageItems({ name, value, services }: { name: string; value: { service_id: string; qty: number }[]; services: RefOption[] }) {
  const [items, setItems] = useState(value.length ? value : [{ service_id: "", qty: 1000 }]);
  const set = (i: number, patch: Partial<{ service_id: string; qty: number }>) => setItems((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={JSON.stringify(items.filter((i) => i.service_id))} />
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-[1fr_7rem_auto] gap-2">
          <Select aria-label={`Item ${i + 1} service`} value={it.service_id} onChange={(e) => set(i, { service_id: e.target.value })}>
            <option value="">Choose service…</option>
            {services.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Input aria-label={`Item ${i + 1} quantity`} type="number" min={1} step={1} value={it.qty} onChange={(e) => set(i, { qty: Number(e.target.value) })} className="font-mono" />
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove item ${i + 1}`} onClick={() => setItems((l) => l.filter((_, j) => j !== i))}><Trash2 aria-hidden /></Button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" className="justify-self-start" onClick={() => setItems((l) => [...l, { service_id: "", qty: 1000 }])}><Plus aria-hidden />Add service</Button>
    </div>
  );
}
