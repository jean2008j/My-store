import {
  fetchPaymentSettings,
  fetchProductsFromDatabase,
  fetchSiteContentFromDatabase,
  trackVisit,
} from "@/lib/db-service";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { StoreGate, useStoreGate } from "@/components/store/store-gate";
import {
  CATALOG_VERSION,
  cloneSeed,
  defaultSettings,
  normalizeContent,
} from "@/lib/store/catalog";
import { useLang } from "@/lib/i18n";
import { useOwl } from "@/lib/store/owl-store";
import { refreshProducts } from "@/lib/store/refresh";
import {
  HeaderControls,
  MobileCategoryBar,
  Announcement,
  MobileMenu,
  NavLinks,
  Footer,
  SearchPanel,
  CartDrawer,
} from "@/components/store/shell-helpers";

export function Shell() {
  const lang = useOwl((state) => state.lang);
  const setLang = useOwl((state) => state.setLang);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const theme = useOwl((state) => state.theme);
  const setTheme = useOwl((state) => state.setTheme);
  const announcement = useOwl((state) => state.settings.content[state.lang].announcement);
  const cartOpen = useOwl((state) => state.cartOpen);
  const searchOpen = useOwl((state) => state.searchOpen);
  const setCartOpen = useOwl((state) => state.setCartOpen);
  const setSearchOpen = useOwl((state) => state.setSearchOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (isAdmin) {
      // The admin is always Arabic — don't touch the customer's saved language.
      document.documentElement.lang = "ar";
      document.documentElement.dir = "rtl";
      return;
    }
    useLang.getState().setLang(lang);
  }, [lang, isAdmin]);
  const count = useOwl((state) => state.cart.reduce((sum, line) => sum + line.qty, 0));

  useEffect(() => {
    let live = true;
    void Promise.resolve(useOwl.persist.rehydrate()).finally(() => {
      if (!live) return;
      const state = useOwl.getState();
      if (state.catalogVersion !== CATALOG_VERSION) {
        useOwl.setState({
          products: cloneSeed(),
          settings: {
            ...defaultSettings,
            shamCashId: state.settings.shamCashId || defaultSettings.shamCashId,
            shamCashName: state.settings.shamCashName || defaultSettings.shamCashName,
            shamCashQr: state.settings.shamCashQr,
            telegramBotToken: state.settings.telegramBotToken,
            telegramChatId: state.settings.telegramChatId,
            adminPin: state.settings.adminPin || defaultSettings.adminPin,
            storePassword: state.settings.storePassword,
            storePasswordEnabled: state.settings.storePasswordEnabled,
          },
          catalogVersion: CATALOG_VERSION,
          hydrated: true,
        });
      } else {
        useOwl.setState({ hydrated: true });
      }
      void fetchProductsFromDatabase().then((rows) => {
        if (live && rows.length) useOwl.setState({ products: rows });
      });
      // Sham Cash account + QR set by the admin (so every customer sees the same ones)
      void fetchPaymentSettings().then((pay) => {
        if (!live || !pay) return;
        useOwl.setState((current) => ({
          settings: {
            ...current.settings,
            ...(pay.shamCashId ? { shamCashId: String(pay.shamCashId) } : {}),
            ...(pay.shamCashName ? { shamCashName: String(pay.shamCashName) } : {}),
            shamCashQr: typeof pay.shamCashQr === "string" ? pay.shamCashQr : "",
          },
        }));
      });
      void fetchSiteContentFromDatabase().then((content) => {
        if (!live || !content) return;
        useOwl.setState((current) => ({
          settings: { ...current.settings, content: normalizeContent(content) },
        }));
      });
    });
    return () => {
      live = false;
    };
  }, []);

  // Daily visitors counter: once per day per browser, never from the admin pages.
  useEffect(() => {
    if (isAdmin) return;
    void trackVisit();
  }, [isAdmin]);

  // Customers see sold-out sizes without reloading: refresh stock every minute and when the tab returns.
  useEffect(() => {
    if (isAdmin) return;
    const refresh = () => {
      if (document.visibilityState === "visible" && useOwl.getState().hydrated) void refreshProducts();
    };
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [isAdmin]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#f4f1ea" : "#0c0c0c");
  }, [theme]);

  useEffect(() => {
    const effective = isAdmin ? "ar" : lang;
    document.documentElement.lang = effective;
    document.documentElement.dir = effective === "ar" ? "rtl" : "ltr";
  }, [lang, isAdmin]);

  useEffect(() => {
    const locked = cartOpen || searchOpen || menuOpen;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, searchOpen, menuOpen]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setCartOpen(false);
      setSearchOpen(false);
      setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCartOpen, setSearchOpen]);

  // Store password: customers must type it before seeing the shop (the admin pages are never gated).
  const gate = useStoreGate(isAdmin);
  if (!isAdmin && gate.status !== "open") {
    return (
      <>
        {gate.status === "locked" ? <StoreGate onUnlock={gate.unlock} /> : <div className="min-h-screen" />}
        <Toaster theme={theme} position="bottom-center" />
      </>
    );
  }

  return (
    <>
      {isAdmin ? null : (
        <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-fg focus:px-3 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>
      {/* Tap-outside layer for the mobile menu */}
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          className="fixed inset-0 z-20 cursor-default lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      {/* Floating glass header — zero height so the page (hero) shows through behind it */}
      <div className="sticky top-0 z-30 h-0" dir="ltr">
        <div className="px-3 pt-2 lg:px-5">
          <div className="overflow-hidden rounded-xl bg-white/75 text-black shadow-lg backdrop-blur-xl backdrop-saturate-150 lg:bg-black/40 lg:text-white">
            <Announcement text={announcement} />
            <header className="px-3 lg:px-6">
              {/* Mobile: burger (far left) · brand (centre) · language, theme, search, bag (bag far right) */}
              <div className="flex items-center py-1.5 lg:hidden">
                <button
                  type="button"
                  className="inline-flex size-9 shrink-0 items-center justify-center"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
                </button>
                {/* centred in the free space between the burger and the controls */}
                <div className="flex min-w-0 flex-1 justify-center">
                  <Link
                    to="/"
                    className="-translate-y-[2px] font-display text-[18px] leading-none font-semibold tracking-[0.12em] whitespace-nowrap text-black uppercase"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Store
                  </Link>
                </div>
                <HeaderControls count={count} onOpen={() => setMenuOpen(false)} />
              </div>
              {/* Mobile: scrollable category strip under the brand row */}
              <div className="lg:hidden">
                <MobileCategoryBar onNavigate={() => setMenuOpen(false)} />
              </div>
              {/* Desktop: logo | nav | controls */}
              <div className="hidden min-h-[85px] grid-cols-[1fr_auto_1fr] items-center gap-6 py-3 lg:grid">
                <div className="flex items-center justify-start">
                  <Link
                    to="/"
                    className="font-display text-2xl font-semibold tracking-widest whitespace-nowrap text-white uppercase"
                  >
                    My Store
                  </Link>
                </div>
                <nav className="lg:max-w-[min(68vw,1300px)]">
                  <NavLinks />
                </nav>
                <div className="flex items-center justify-end gap-4">
                  <HeaderControls count={count} onOpen={() => setMenuOpen(false)} />
                </div>
              </div>
            </header>
            <MobileMenu open={menuOpen} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      </div>
        </>
      )}
      <main id="main" className={isAdmin ? "pt-6" : pathname === "/" ? "" : "pt-32 lg:pt-44"}>
        <Outlet />
      </main>
      {isAdmin ? null : (
        <>
          <Footer />
          <SearchPanel />
          <CartDrawer />
        </>
      )}
      <Toaster theme={theme} position="bottom-center" />
    </>
  );
}
