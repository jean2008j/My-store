import { createFileRoute } from "@tanstack/react-router";
import { HomeSections } from "@/components/store/home-sections";
import { Shell } from "@/components/store/shell";
import { useOwl } from "@/lib/store/owl-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "My Store — New Drop" }],
  }),
  component: HomePage,
});

function HomePage() {
  const lang = useOwl((state) => state.lang);
  const content = useOwl((state) => state.settings.content[state.lang]);
  const products = useOwl((state) => state.products);

  return (
    <Shell>
      <HomeSections lang={lang} content={content} products={products} />
    </Shell>
  );
}
