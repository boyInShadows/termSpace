"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { ContextHelp } from "@/components/ui/context-help";
import type { HelpTopic } from "@/components/ui/context-help-copy";
import { draftRowPath } from "./draft-validation";

// `cell` is the extra's position in the submitted row (0 is the option itself), so the
// screen order can differ from the manifest order.
type Extra = { cell: number; label: string; type?: "checkbox"; optional?: boolean; wide?: boolean; defaultValue?: string };
type Choice = { value: string; label: string };

// Tick the options that apply, then describe each ticked one. It submits the same
// JSON rows as DeclarationRows (first cell is the option), so the manifest builder
// and browser checkpoints are unchanged.
export function ChoiceRows({ name, label, help, hint, choices, extras, initialRows, required = false, onChange, messages }: {
  name: string;
  label: string;
  help?: HelpTopic;
  hint?: string;
  choices: Choice[];
  extras: Extra[];
  initialRows: string[][];
  required?: boolean;
  onChange: () => void;
  messages: { chooseOne: string };
}) {
  const id = useId();
  const first = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState(initialRows);
  const known = new Set(choices.map((choice) => choice.value));
  const all = [...choices, ...rows.filter(([key]) => !known.has(key)).map(([key]) => ({ value: key, label: key.replaceAll("_", " ") }))];
  const labelFor = (key: string) => all.find((choice) => choice.value === key)?.label ?? key;
  function update(next: string[][]) { setRows(next); onChange(); }
  function toggle(key: string, on: boolean) {
    const row = [key, ...Array<string>(Math.max(0, ...extras.map((extra) => extra.cell))).fill("")];
    for (const extra of extras) row[extra.cell] = extra.defaultValue ?? (extra.type === "checkbox" ? "false" : "");
    update(on ? [...rows, row] : rows.filter(([item]) => item !== key));
  }

  // The hidden JSON cannot be "required", so the first box reports an empty selection.
  useEffect(() => { first.current?.setCustomValidity(required && rows.length === 0 ? messages.chooseOne : ""); }, [required, rows.length, messages.chooseOne]);

  return <fieldset className="min-w-0" data-draft-feedback data-draft-optional-group={!required || undefined}>
    <legend className="w-full text-sm font-semibold"><span className="flex min-h-11 items-center justify-between gap-2"><span>{label}{required && <span aria-hidden="true"> *</span>}</span>{help && <ContextHelp label={label} topic={help} />}</span></legend>
    {hint && <p className="mb-3 text-xs text-muted-foreground">{hint}</p>}
    <input type="hidden" name={name} value={JSON.stringify(rows)} />
    <div className="grid gap-2 sm:grid-cols-2">{all.map((choice, index) => <label key={choice.value} className="flex min-h-11 items-center gap-3 rounded-control border px-3 text-sm has-[:checked]:border-primary">
      <input id={`${id}-choice-${index}`} ref={index === 0 ? first : undefined} data-draft-required-group={required && index === 0 ? "true" : undefined} type="checkbox" className="size-5" checked={rows.some(([key]) => key === choice.value)} onChange={(event) => toggle(choice.value, event.target.checked)} />{choice.label}
    </label>)}</div>
    {rows.length > 0 && <div className="mt-4 space-y-3">{rows.map((row, rowIndex) => <div key={row[0]} className="space-y-3 rounded-control border bg-muted/40 p-4">
      <p className="text-sm font-semibold">{labelFor(row[0])}</p>
      <div className="grid gap-4 sm:grid-cols-2">{extras.map((extra, extraIndex) => {
        const fieldId = `${id}-${rowIndex}-${extraIndex}`;
        const value = row[extra.cell] ?? "";
        const change = (next: string) => update(rows.map((item, index) => index === rowIndex ? item.map((existing, col) => col === extra.cell ? next : existing) : item));
        return extra.type === "checkbox"
          ? <label key={extraIndex} htmlFor={fieldId} className="flex min-h-11 items-center gap-3 text-sm font-medium"><input id={fieldId} className="size-5" type="checkbox" checked={value === "true"} onChange={(event) => change(String(event.target.checked))} />{extra.label}</label>
          : <div key={extraIndex} data-draft-feedback className={extra.wide ? "sm:col-span-2" : undefined}><label htmlFor={fieldId} className="mb-2 block text-sm font-medium">{extra.label}{!extra.optional && <span aria-hidden="true"> *</span>}</label><Input id={fieldId} data-draft-path={draftRowPath(name, rowIndex, extra.cell)} required={!extra.optional} value={value} onChange={(event) => change(event.target.value)} dir="auto" /></div>;
      })}</div>
    </div>)}</div>}
  </fieldset>;
}
