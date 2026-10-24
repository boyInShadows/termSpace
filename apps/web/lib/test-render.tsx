import { render, type RenderOptions } from "@testing-library/react";
import { LocaleProvider } from "./locale-context";
import { copy } from "./i18n";

/** Match the root layout's server-supplied dictionary in isolated UI tests. */
export function renderWithLocale(ui: React.ReactNode, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }) => <LocaleProvider locale="en" messages={copy.en}>{children}</LocaleProvider>,
    ...options,
  });
}
