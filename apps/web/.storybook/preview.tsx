import type { Preview } from "@storybook/nextjs-vite";
import "../styles/globals.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    a11y: { test: "todo" },
    backgrounds: { options: { void: { name: "Void", value: "#090913" }, daylight: { name: "Daylight", value: "#f7f7fb" } } },
  },
  decorators: [(Story) => <div className="min-w-[320px] max-w-[900px] p-6"><Story /></div>],
};
export default preview;
