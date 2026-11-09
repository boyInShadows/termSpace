"use client";

import { useEffect, useState, type ComponentProps, type ComponentType } from "react";

type ChatProps = ComponentProps<typeof import("./chat-widget").ChatWidget>;

export function ChatLoader(props: ChatProps) {
  const configured = Boolean(props.locale === "fa" ? props.tokenFa || props.tokenEn : props.tokenEn);
  const [Widget, setWidget] = useState<ComponentType<ChatProps> | null>(null);
  useEffect(() => {
    if (!configured) return;
    let active = true;
    void import("./chat-widget").then(module => {
      if (active) setWidget(() => module.ChatWidget);
    }).catch(error => console.error("Support chat could not load", error));
    return () => { active = false; };
  }, [configured]);
  return configured && Widget ? <Widget {...props} /> : null;
}
