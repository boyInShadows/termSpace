"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { DraftIssue } from "./draft-validation";

/** Dynamic rows and ordinary fields use the same adjacent feedback and ARIA relationship. */
export function DraftFieldErrors({ issues }: { issues: DraftIssue[] }) {
  const unique = issues.filter((issue, index) => issues.findIndex(other => other.control === issue.control) === index);
  useEffect(() => {
    const restore = unique.map(({ control }, index) => {
      const previous = control.getAttribute("aria-describedby");
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-describedby", `${previous ?? ""} draft-field-error-${index}`.trim());
      return () => {
        control.removeAttribute("aria-invalid");
        if (previous) control.setAttribute("aria-describedby", previous); else control.removeAttribute("aria-describedby");
      };
    });
    return () => restore.forEach(reset => reset());
  }, [unique]);
  return unique.map(({ control, message }, index) => {
    const parent = control.closest<HTMLElement>("[data-draft-feedback]") ?? control.parentElement;
    return parent && createPortal(<p id={`draft-field-error-${index}`} className="mt-2 text-sm text-destructive">{message}</p>, parent, String(index));
  });
}
