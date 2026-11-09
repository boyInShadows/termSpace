import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { DeferredReview } from "./deferred-review";
import { reviewCopy } from "./review-copy";

vi.mock("./review-composer", () => ({ ReviewComposer: ({ slug }: { slug: string }) => <div>Review {slug}</div> }));

it("loads the review composer after hydration without including it in server HTML", async () => {
  const view = <DeferredReview slug="test-listing" messages={reviewCopy.en} />;
  expect(renderToString(view)).toBe("");
  render(view);
  expect(await screen.findByText("Review test-listing")).toBeInTheDocument();
});
