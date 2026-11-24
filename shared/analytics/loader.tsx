"use client";

import dynamic from "next/dynamic";
import type { ConsentPanelProps } from "./consent";

const ConsentPanel = dynamic(() => import("./consent").then((module) => module.ConsentPanel), { ssr: false });

export function AnalyticsConsent(props: ConsentPanelProps) {
  return <ConsentPanel {...props} />;
}
