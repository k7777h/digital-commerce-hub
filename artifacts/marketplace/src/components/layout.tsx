import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, Folders, Plus, Store, Languages, ShoppingCart, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/i18n/LanguageContext";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/format";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { t, lang, toggleLang } = useLang();
  const { items, totalItems, totalPrice, removeFromCart, clearCart } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [badgeBump, setBadgeBump] = useState(false);
  const prevTotal = useRef(totalItems);
  const cartRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/products", label: t.nav.products, icon: Package },
    { href: "/categories", label: t.nav.categories, icon: Folders },
  ];

  const isArabic = lang === "ar";

  // Animate badge bump whenever an item is added
  useEffect(() => {
    if (totalItems > prevTotal.current) {
      setBadgeBump(true);
      const t = setTimeout(() => setBadgeBump(false), 400);
      prevTotal.current = totalItems;
      return () => clearTimeout(t);
    }
    prevTotal.current = totalItems;
  }, [totalItems]);

  // Close cart on outside click
  useEffect(() => {
    if (!cartOpen) return;
    function handler(e: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setCartOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [cartOpen]);

  return (
    <div
      className="flex h-screen overflow-hidden bg-background"
      style={{ fontFamily: isArabic ? "'Cairo', sans-serif" : "'Inter', sans-serif" }}
    >
      {/* Sidebar */}
      <div className={cn("w-64 flex-shrink-0 border-r bg-sidebar text-sidebar-foreground hidden md:flex flex-col", isArabic && "border-r-0 border-l")}>
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border font-bold text-lg gap-2 tracking-tight">
          <Store className="w-5 h-5 text-sidebar-primary" />
          <span>{t.appName}</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Link href="/products/new" className="block">
            <div className="flex items-center justify-center gap-2 w-full bg-sidebar-primary text-sidebar-primary-foreground py-2 px-4 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />
              {t.nav.addProduct}
            </div>
          </Link>
          <button
            onClick={toggleLang}
            className="flex items-center justify-center gap-2 w-full border border-sidebar-border text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            <Languages className="w-4 h-4 flex-shrink-0" />
            {t.langToggle}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 flex-shrink-0 border-b bg-card flex items-center justify-between px-6 relative z-20">
          <div className="font-bold text-lg tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <span>{t.appName}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
            >
              <Languages className="w-4 h-4" />
              {t.langToggle}
            </button>

            {/* Cart button */}
            <button
              onClick={() => setCartOpen((o) => !o)}
              className="relative flex items-center justify-center w-10 h-10 rounded-md border border-border hover:bg-muted transition-colors"
              aria-label={t.cart.title}
            >
              <ShoppingCart className="w-5 h-5 text-foreground/80" />
              {totalItems > 0 && (
                <span
                  className={cn(
                    "absolute -top-1.5 -end-1.5 min-w-[1.25rem] h-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold px-1 transition-transform",
                    badgeBump && "scale-125"
                  )}
                  style={{ transition: "transform 0.2s cubic-bezier(.36,.07,.19,.97)" }}
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Cart drawer overlay */}
        {cartOpen && (
          <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setCartOpen(false)} />
        )}

        {/* Cart panel */}
        <div
          ref={cartRef}
          className={cn(
            "fixed top-0 h-full w-80 bg-card border-s border-border shadow-2xl z-40 flex flex-col transition-transform duration-300",
            isArabic ? "left-0" : "right-0",
            cartOpen
              ? "translate-x-0"
              : isArabic
                ? "-translate-x-full"
                : "translate-x-full"
          )}
        >
          {/* Cart header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2 font-semibold text-base">
              <ShoppingCart className="w-5 h-5 text-primary" />
              {t.cart.title}
              {totalItems > 0 && (
                <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                  {t.cart.items(totalItems)}
                </span>
              )}
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 pb-12">
                <ShoppingCart className="w-14 h-14 text-muted-foreground/20 mb-4" />
                <p className="font-medium text-foreground/80">{t.cart.empty}</p>
                <p className="text-sm text-muted-foreground mt-1">{t.cart.emptySub}</p>
                <Link
                  href="/products"
                  onClick={() => setCartOpen(false)}
                  className="mt-5 inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {t.cart.browseProducts}
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3 p-4 group">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-md bg-muted overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.id}`}
                        onClick={() => setCartOpen(false)}
                        className="text-sm font-medium leading-snug truncate block hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-sm font-semibold text-primary">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ×{item.quantity}
                        </span>
                      </div>
                    </div>
                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all self-start flex-shrink-0"
                      title={t.cart.remove}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cart footer */}
          {items.length > 0 && (
            <div className="border-t border-border p-5 space-y-3 flex-shrink-0">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-muted-foreground">{t.cart.total}</span>
                <span className="text-lg font-bold text-foreground">{formatCurrency(totalPrice)}</span>
              </div>
              <button className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity">
                {t.cart.checkout}
              </button>
              <button
                onClick={clearCart}
                className="w-full text-muted-foreground text-xs hover:text-destructive transition-colors py-1"
              >
                {t.cart.clearCart}
              </button>
            </div>
          )}
        </div>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
