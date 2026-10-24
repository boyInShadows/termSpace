import type { Preview } from "@storybook/nextjs-vite";
import "../styles/globals.css";
import { LocaleProvider } from "../lib/locale-context";
import { copy } from "../lib/i18n";

const preview: Preview = {
  parameters: {
    nextjs: { appDirectory: true },
    layout: "centered",
    a11y: { test: "todo" },
    backgrounds: { options: { void: { name: "Void", value: "#090913" }, daylight: { name: "Daylight", value: "#f7f7fb" } } },
  },
  decorators: [(Story) => <LocaleProvider locale="en" messages={copy.en}><div className="min-w-[320px] max-w-[900px] p-6"><Story /></div></LocaleProvider>],
};
export default preview;
