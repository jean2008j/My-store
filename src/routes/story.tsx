import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/store/info-page";
import { STORY } from "@/lib/store/pages";
import { useOwl } from "@/lib/store/owl-store";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [{ title: "Our story — My Store" }],
  }),
  component: Page,
});

function Page() {
  const lang = useOwl((state) => state.lang);
  return <InfoPage page={STORY[lang]} />;
}
