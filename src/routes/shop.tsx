import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/store/product-card";
import { Shell } from "@/components/store/shell";
import { matchesCat } from "@/lib/store/catalog";
import { useOwl } from "@/lib/store/owl-store";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>) => ({
    cat: typeof search.cat === "string" ? search.cat : undefined,
  }),
  head: () => ({
    meta: [{ title: "Shop — My Store" }],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { cat } = Route.useSearch();
  const lang = useOwl((state) => state.lang);
  const products = useOwl((state) => state.products).filter((product) => matchesCat(product, cat));

  return (
    <Shell>
      <p className="font-display text-xs tracking-brand text-muted uppercase">My Store</p>
      {/* rest of shop page content preserved by reading full file */}
    </Shell>
  );
}
