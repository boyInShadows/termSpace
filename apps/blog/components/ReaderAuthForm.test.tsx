import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loginReaderWithGoogle = vi.hoisted(() => vi.fn());
const loginReader = vi.hoisted(() => vi.fn());
const syncLocalLibrary = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
vi.mock("@/lib/api", () => ({ api: { loginReaderWithGoogle, loginReader } }));
vi.mock("@/lib/readerLibrary", () => ({ syncLocalLibrary }));
vi.mock("next/script", () => ({ default: ({ onReady, onError }: { onReady: () => void; onError: () => void }) => <><button onClick={onReady}>SDK ready</button><button onClick={onError}>SDK failed</button></> }));
const { ReaderAuthForm } = await import("./ReaderAuthForm");
const initialize = vi.fn();
const renderButton = vi.fn();

describe("blog Google sign-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "test-client.apps.googleusercontent.com");
    window.google = { accounts: { id: { initialize, renderButton } } };
    loginReaderWithGoogle.mockResolvedValue({});
    syncLocalLibrary.mockResolvedValue(undefined);
  });
  afterEach(() => { cleanup(); vi.unstubAllEnvs(); delete window.google; });

  it("initializes when the SDK is ready and completes account sign-in", async () => {
    render(<ReaderAuthForm />);
    fireEvent.click(screen.getByRole("button", { name: "SDK ready" }));
    expect(renderButton).toHaveBeenCalledOnce();
    await act(async () => { await initialize.mock.calls[0][0].callback({ credential: "signed-google-token" }); });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/library"));
    expect(loginReaderWithGoogle).toHaveBeenCalledWith("signed-google-token");
    expect(syncLocalLibrary).toHaveBeenCalled();
  });

  it("reports an SDK load failure", () => {
    render(<ReaderAuthForm />);
    fireEvent.click(screen.getByRole("button", { name: "SDK failed" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Google sign-in is unavailable");
  });

  it("localizes an unknown Google failure in Persian", async () => {
    loginReaderWithGoogle.mockRejectedValueOnce("unknown failure");
    render(<ReaderAuthForm locale="fa" />);
    fireEvent.click(screen.getByRole("button", { name: "SDK ready" }));
    await act(async () => { await initialize.mock.calls[0][0].callback({ credential: "signed-google-token" }); });
    expect(screen.getByRole("alert")).toHaveTextContent("ورود با Google انجام نشد. دوباره تلاش کنید.");
  });

  it.each([
    ["unknown failure", "ادامهٔ ورود انجام نشد. دوباره تلاش کنید."],
    [new Error("Specific server error"), "Specific server error"],
  ] as const)("localizes unknown login errors and preserves server details (%s)", async (error, message) => {
    loginReader.mockRejectedValueOnce(error);
    render(<ReaderAuthForm locale="fa" />);
    fireEvent.submit(screen.getByLabelText("ایمیل").closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
  });
});
