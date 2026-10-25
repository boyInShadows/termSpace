"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContextHelp } from "@/components/ui/context-help";
import type { HelpTopic } from "@/components/ui/context-help-copy";

type Column = { label: string; type?: "checkbox" | "url"; optional?: boolean; options?: string[] };

export function DeclarationRows({ name, label, help, hint, columns, initialRows, required = false, onChange, messages }: {
  name: string;
  label: string;
  help?: HelpTopic;
  hint?: string;
  columns: Column[];
  initialRows: string[][];
  required?: boolean;
  onChange: () => void;
  messages: { choose: string; removeRow: string; noDeclarations: string; addRow: string };
}) {
  const copy = messages;
  const id = useId();
  const [rows, setRows] = useState(() => initialRows.length ? initialRows : required ? [columns.map(() => "")] : []);
  function update(next: string[][]) { setRows(next); onChange(); }

  return <fieldset className="min-w-0 border-t py-4">
    <legend className="w-full text-sm font-semibold"><span className="flex min-h-11 items-center justify-between gap-2"><span>{label}{required && <span aria-hidden="true"> *</span>}</span>{help && <ContextHelp label={label} topic={help} />}</span></legend>
    {hint && <p className="mb-3 text-xs text-muted-foreground">{hint}</p>}
    <input type="hidden" name={name} value={JSON.stringify(rows)} />
    <div className="space-y-5">{rows.map((row, rowIndex) => <div key={rowIndex} className="space-y-3 border-b pb-4">
      <div className="grid gap-4 sm:grid-cols-2">{columns.map((column, columnIndex) => {
        const fieldId = `${id}-${rowIndex}-${columnIndex}`;
        const value = row[columnIndex] ?? "";
        const change = (next: string) => update(rows.map((item, index) => index === rowIndex ? item.map((cell, col) => col === columnIndex ? next : cell) : item));
        return <div key={columnIndex}>
          <label htmlFor={fieldId} className="mb-2 block text-sm font-medium">{column.label}</label>
          {column.type === "checkbox" ? <input id={fieldId} className="size-6" type="checkbox" checked={value === "true"} onChange={(event) => change(String(event.target.checked))} />
            : column.options ? <select id={fieldId} className="min-h-11 w-full border bg-surface px-3 text-base" required={!column.optional} value={value} onChange={(event) => change(event.target.value)}><option value="">{copy.choose}</option>{column.options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select>
              : <Input id={fieldId} type={column.type ?? "text"} pattern={column.type === "url" ? "https://.+" : undefined} required={!column.optional} value={value} onChange={(event) => change(event.target.value)} dir="auto" />}
        </div>;
      })}</div>
      <Button type="button" size="sm" variant="secondary" disabled={required && rows.length === 1} onClick={() => update(rows.filter((_, index) => index !== rowIndex))}>{copy.removeRow} {rowIndex + 1}</Button>
    </div>)}</div>
    {rows.length === 0 && <p className="mb-3 text-sm text-muted-foreground">{copy.noDeclarations}</p>}
    <Button type="button" size="sm" variant="secondary" onClick={() => update([...rows, columns.map((column) => column.type === "checkbox" ? "false" : "")])}>{copy.addRow}: {label}</Button>
  </fieldset>;
}
