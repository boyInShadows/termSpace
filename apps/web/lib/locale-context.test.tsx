import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { copy } from "./i18n";
import { LocaleProvider, useLocale } from "./locale-context";

function Consumer() {
  const { locale, t } = useLocale();
  return <p lang={locale}>{t.signIn}</p>;
}

describe("server-supplied locale messages", () => {
  it("updates the locale and copy together when navigating between languages", () => {
    const view = render(<LocaleProvider locale="en" messages={copy.en}><Consumer /></LocaleProvider>);
    expect(screen.getByText(copy.en.signIn)).toHaveAttribute("lang", "en");
    view.rerender(<LocaleProvider locale="fa" messages={copy.fa}><Consumer /></LocaleProvider>);
    expect(screen.getByText(copy.fa.signIn)).toHaveAttribute("lang", "fa");
    expect(screen.queryByText(copy.en.signIn)).not.toBeInTheDocument();
  });
});
