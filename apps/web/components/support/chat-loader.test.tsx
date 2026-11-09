import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ChatLoader } from "./chat-loader";

vi.mock("./chat-widget", () => ({ ChatWidget: ({ locale }: { locale: string }) => <div>Chat {locale}</div> }));

it("stays empty without configuration and loads the configured localized chat", async () => {
  const { container, rerender } = render(<ChatLoader locale="en" />);
  expect(container).toBeEmptyDOMElement();
  rerender(<ChatLoader locale="fa" tokenEn="existing-inbox" />);
  expect(await screen.findByText("Chat fa")).toBeInTheDocument();
  rerender(<ChatLoader locale="en" />);
  expect(container).toBeEmptyDOMElement();
});
