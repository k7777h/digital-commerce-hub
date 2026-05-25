import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, Folders, Plus, Store, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/i18n/LanguageContext";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { t, lang, toggleLang } = useLang();

  const navItems = [
    { href: "/", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/products", label: t.nav.products, icon: Package },
    { href: "/categories", label: t.nav.categories, icon: Folders },
  ];

  const isArabic = lang === "ar";

  return (
    <div className="flex h-screen overflow-hidden bg-background" style={{ fontFamily: isArabic ? "'Cairo', sans-serif" : "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div className={cn("w-64 flex-shrink-0 border-r bg-sidebar text-sidebar-foreground hidden md:flex flex-col", isArabic && "border-r-0 border-l")}>
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border font-bold text-lg gap-2 tracking-tight">
          <Store className="w-5 h-5 text-sidebar-primary" />
          <span>{t.appName}</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 flex-shrink-0 border-b bg-card flex items-center justify-between px-6">
          <div className="font-bold text-lg tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <span>{t.appName}</span>
          </div>
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
          >
            <Languages className="w-4 h-4" />
            {t.langToggle}
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
