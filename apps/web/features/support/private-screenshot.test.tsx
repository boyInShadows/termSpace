import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PrivateScreenshot } from "./private-screenshot";
import { supportCopy } from "./support-copy";

it("keeps downloads authenticated and retries a failed image without the image optimizer", () => {
  render(<PrivateScreenshot attachment={{ id: "image-1", bytes: 100, width: 48, height: 32 }} number={1} admin locale="en" />);
  const image = screen.getByRole("img", { name: "Screenshot 1" });
  expect(image.getAttribute("src")).toMatch(/\/backend\/api\/support\/admin\/attachments\/image-1\?attempt=0$/);
  fireEvent.error(image);
  expect(screen.getByRole("alert")).toHaveTextContent("could not be loaded");
  fireEvent.click(screen.getByRole("button", { name: supportCopy.en.retry }));
  expect(screen.getByRole("img").getAttribute("src")).toContain("attempt=1");
  expect(screen.getByRole("link", { name: "Open screenshot 1" })).toHaveAttribute("href", "/backend/api/support/admin/attachments/image-1");
});
