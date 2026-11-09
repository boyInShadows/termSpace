"use client";

import { useEffect, useState, type ComponentProps, type ComponentType } from "react";

type ReviewProps = ComponentProps<typeof import("./review-composer").ReviewComposer>;

export function DeferredReview(props: ReviewProps) {
  const [Composer, setComposer] = useState<ComponentType<ReviewProps> | null>(null);
  const [failure, setFailure] = useState<unknown>(null);
  useEffect(() => {
    let active = true;
    void import("./review-composer").then(module => {
      if (active) setComposer(() => module.ReviewComposer);
    }).catch(cause => { if (active) setFailure(cause); });
    return () => { active = false; };
  }, []);
  if (failure) throw failure;
  return Composer ? <Composer {...props} /> : null;
}
