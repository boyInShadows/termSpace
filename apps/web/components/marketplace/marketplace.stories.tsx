import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProductCard } from "./product-card";
import { products, creators, productDetail } from "@/lib/fixtures";
import {
  CompatibilityBadges,
  CreatorIdentity,
  ProductTypeBadge,
  Rating,
  TrustStatus,
} from "./product-parts";
import { EmptyState } from "@/components/patterns/empty-state";
import { ProductActions } from "@/features/product/product-actions";
const meta = {
  title: "Community library/ResourceCard",
  component: ProductCard,
  tags: ["autodocs"],
  args: { product: products[0] },
} satisfies Meta<typeof ProductCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Compact: Story = {};
export const Expanded: Story = { args: { variant: "expanded" } };
export const List: Story = {
  args: { variant: "list" },
  parameters: { viewport: { defaultViewport: "tablet" } },
};
export const Free: Story = { args: { product: products[6] } };
export const Unverified: Story = { args: { product: products[9] } };
export const ProductTypeBadges: Story = {
  render: () => (
    <div className="flex gap-2">
      <ProductTypeBadge type="Prompt" />
      <ProductTypeBadge type="Skill" />
      <ProductTypeBadge type="Agent" />
      <ProductTypeBadge type="MCP server" />
    </div>
  ),
};
export const Creator: Story = {
  render: () => <CreatorIdentity creator={creators[0]} />,
};
export const Ratings: Story = {
  render: () => (
    <div className="flex gap-6">
      <Rating rating={4.9} count={184} />
      <Rating rating={3.8} count={12} />
    </div>
  ),
};
export const Compatibility: Story = {
  render: () => (
    <CompatibilityBadges compatibility={products[1].compatibility} limit={5} />
  ),
};
export const Trust: Story = {
  render: () => (
    <div className="flex gap-3">
      <TrustStatus />
      <TrustStatus status="Review" />
    </div>
  ),
};
export const Empty: Story = {
  render: () => (
    <div className="w-[700px]">
      <EmptyState />
    </div>
  ),
};
export const PreviewDialog: Story = {
  render: () => (
    <div className="w-80">
      <ProductActions product={productDetail} />
    </div>
  ),
};
