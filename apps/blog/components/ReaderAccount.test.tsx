import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReaderAccount } from "./ReaderAccount";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  ApiClientError: class ApiClientError extends Error {
    status: number;
    constructor(status: number, message: string) { super(message); this.status = status; }
  },
  api: {
    getReaderProfile: vi.fn(),
    getReaderLibrary: vi.fn(),
    changeReaderPassword: vi.fn(),
    logoutReader: vi.fn(),
  },
}));

const profile = {
  email: "reader@example.com",
  createdAt: "2026-08-25T00:00:00.000Z",
  hasPassword: true,
  connectedGoogle: false,
  emailVerified: false,
};

const library = {
  bookmarks: [{
    createdAt: "2026-08-26T00:00:00.000Z",
    article: { id: "article-1", slug: "saved-article", title: "Saved article", excerpt: null, heroImage: null, publishedAt: "2026-08-24T00:00:00.000Z" },
  }],
  history: [{
    percentage: 42,
    visitedAt: "2026-08-27T00:00:00.000Z",
    article: { id: "article-2", slug: "read-article", title: "Read article", excerpt: null, heroImage: null, publishedAt: "2026-08-24T00:00:00.000Z" },
  }],
};

describe("ReaderAccount", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getReaderProfile).mockResolvedValue({ data: profile });
    vi.mocked(api.getReaderLibrary).mockResolvedValue({ data: library });
    vi.mocked(api.changeReaderPassword).mockResolvedValue(undefined);
  });

  it("shows the signed-in profile, bookmarks, and reading history", async () => {
    render(<ReaderAccount />);

    expect(await screen.findByRole("heading", { name: "reader@example.com" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Saved article" })).toHaveAttribute("href", "/blog/saved-article");
    expect(screen.getByRole("link", { name: "Read article" })).toHaveAttribute("href", "/blog/read-article");
    expect(screen.getByText("42% read")).toBeInTheDocument();
  });

  it("changes a password after confirming it", async () => {
    const user = userEvent.setup();
    render(<ReaderAccount />);
    await screen.findByRole("heading", { name: "Change password" });

    await user.type(screen.getByLabelText("Current password"), "old-password");
    await user.type(screen.getByLabelText("New password"), "new-password");
    await user.type(screen.getByLabelText("Confirm new password"), "new-password");
    await user.click(screen.getByRole("button", { name: "Save password" }));

    await waitFor(() => expect(api.changeReaderPassword).toHaveBeenCalledWith("old-password", "new-password"));
    expect(screen.getByRole("status")).toHaveTextContent("Your password has been updated.");
  });
});
