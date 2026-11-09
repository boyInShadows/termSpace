import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({ default: ({ onReady, onError }: { onReady: () => void; onError: () => void }) => <div data-testid="google-script"><button onClick={onReady}>SDK ready</button><button onClick={onError}>SDK failed</button></div> }));
const { GoogleSignIn } = await import("./google-sign-in");
const initialize = vi.fn();
const renderButton = vi.fn();

const props = { locale: "en", label: "Continue with Google", disabled: false };

describe("Google sign-in button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "test-client.apps.googleusercontent.com");
    window.google = { accounts: { id: { initialize, renderButton } } };
  });
  afterEach(() => { cleanup(); vi.unstubAllEnvs(); delete window.google; });

  it("shows the site's label and forwards the credential when the SDK is ready", () => {
    const onCredential = vi.fn().mockResolvedValue(undefined);
    render(<GoogleSignIn {...props} onCredential={onCredential} onUnavailable={vi.fn()} />);
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "SDK ready" }));
    expect(initialize).toHaveBeenCalledWith({ client_id: "test-client.apps.googleusercontent.com", callback: expect.any(Function) });
    expect(renderButton).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ text: "continue_with", locale: "en" }));
    initialize.mock.calls[0][0].callback({ credential: "signed-google-token" });
    expect(onCredential).toHaveBeenCalledWith("signed-google-token");
  });

  it("stretches Google's iframe across the visible button", () => {
    renderButton.mockImplementation((target: HTMLElement) => {
      const frame = document.createElement("iframe");
      frame.style.margin = "-2px -10px";
      target.appendChild(frame);
    });
    render(<GoogleSignIn {...props} onCredential={vi.fn()} onUnavailable={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "SDK ready" }));
    const frame = document.querySelector("iframe");
    const style = frame?.getAttribute("style") ?? "";
    expect(style).toContain("position: absolute");
    expect(style).toContain("width: 100%");
    expect(style).toContain("height: 100%");
  });

  it("reports a blocked SDK instead of silently leaving an empty sign-in control", () => {
    const onUnavailable = vi.fn();
    render(<GoogleSignIn {...props} onCredential={vi.fn()} onUnavailable={onUnavailable} />);
    fireEvent.click(screen.getByRole("button", { name: "SDK failed" }));
    expect(onUnavailable).toHaveBeenCalledOnce();
  });

  it("does not load Google or draw the button when no client ID is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
    render(<GoogleSignIn {...props} onCredential={vi.fn()} onUnavailable={vi.fn()} />);
    expect(screen.queryByTestId("google-script")).not.toBeInTheDocument();
    expect(screen.queryByText("Continue with Google")).not.toBeInTheDocument();
  });
});
