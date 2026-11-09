import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({
  default: ({ id, src, onLoad, dangerouslySetInnerHTML }: { id: string; src?: string; onLoad?: () => void; dangerouslySetInnerHTML?: { __html: string } }) => (
    <div data-testid={id} data-src={src} data-html={dangerouslySetInnerHTML?.__html}>
      {onLoad ? <button onClick={onLoad}>load</button> : null}
    </div>
  ),
}));

const { ChatWidget } = await import("./chat-widget");
const run = vi.fn();

describe("ChatWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.chatwootSDK = { run };
  });
  afterEach(() => {
    cleanup();
    delete window.chatwootSDK;
    delete window.chatwootSettings;
  });

  it("renders nothing without a website token", () => {
    const { container } = render(<ChatWidget locale="en" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("loads the SDK and starts the English inbox with localized settings", () => {
    const { getByTestId } = render(
      <ChatWidget locale="en" baseUrl="https://chat.termspace.dev/" tokenEn="token-en" tokenFa="token-fa" />,
    );
    expect(getByTestId("chatwoot-sdk")).toHaveAttribute("data-src", "https://chat.termspace.dev/packs/js/sdk.js");
    expect(getByTestId("chatwoot-settings").getAttribute("data-html")).toContain('"locale":"en"');
    expect(getByTestId("chatwoot-settings").getAttribute("data-html")).toContain("online 24/7");
    fireEvent.click(getByTestId("chatwoot-sdk").querySelector("button")!);
    expect(run).toHaveBeenCalledWith({ websiteToken: "token-en", baseUrl: "https://chat.termspace.dev" });
  });

  it("uses the Persian inbox and launcher label on the Persian site", () => {
    const { getByTestId } = render(
      <ChatWidget locale="fa" baseUrl="https://chat.termspace.dev" tokenEn="token-en" tokenFa="token-fa" />,
    );
    expect(getByTestId("chatwoot-settings").getAttribute("data-html")).toContain('"locale":"fa"');
    expect(getByTestId("chatwoot-settings").getAttribute("data-html")).toContain("ترم‌بادی");
    fireEvent.click(getByTestId("chatwoot-sdk").querySelector("button")!);
    expect(run).toHaveBeenCalledWith({ websiteToken: "token-fa", baseUrl: "https://chat.termspace.dev" });
  });

  it("falls back to the English inbox when the Persian token is missing", () => {
    const { getByTestId } = render(<ChatWidget locale="fa" tokenEn="token-en" />);
    fireEvent.click(getByTestId("chatwoot-sdk").querySelector("button")!);
    expect(run).toHaveBeenCalledWith({ websiteToken: "token-en", baseUrl: "https://chat.termspace.dev" });
  });
});
