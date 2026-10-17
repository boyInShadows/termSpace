import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({ default: ({ onReady, onError }: { onReady: () => void; onError: () => void }) => <div data-testid="google-script"><button onClick={onReady}>SDK ready</button><button onClick={onError}>SDK failed</button></div> }));
const { GoogleSignIn } = await import("./google-sign-in");
const initialize = vi.fn();
const renderButton = vi.fn();

describe("Google sign-in button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "test-client.apps.googleusercontent.com");
    window.google = { accounts: { id: { initialize, renderButton } } };
  });
  afterEach(() => { vi.unstubAllEnvs(); delete window.google; });

  it("renders Google's button and forwards the credential when the SDK is ready", () => {
    const onCredential = vi.fn().mockResolvedValue(undefined);
    render(<GoogleSignIn locale="en" disabled={false} onCredential={onCredential} onUnavailable={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "SDK ready" }));
    expect(initialize).toHaveBeenCalledWith({ client_id: "test-client.apps.googleusercontent.com", callback: expect.any(Function) });
    expect(renderButton).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ theme: "outline", locale: "en" }));
    initialize.mock.calls[0][0].callback({ credential: "signed-google-token" });
    expect(onCredential).toHaveBeenCalledWith("signed-google-token");
  });

  it("reports a blocked SDK instead of silently leaving an empty sign-in control", () => {
    const onUnavailable = vi.fn();
    render(<GoogleSignIn locale="en" disabled={false} onCredential={vi.fn()} onUnavailable={onUnavailable} />);
    fireEvent.click(screen.getByRole("button", { name: "SDK failed" }));
    expect(onUnavailable).toHaveBeenCalledOnce();
  });

  it("does not load Google when no client ID is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");
    render(<GoogleSignIn locale="en" disabled={false} onCredential={vi.fn()} onUnavailable={vi.fn()} />);
    expect(screen.queryByTestId("google-script")).not.toBeInTheDocument();
  });
});
