import { useState } from "react";
import { useGetProductStats, useListProducts, getGetProductStatsQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, TrendingUp, Loader2, ShoppingCart, Check, Minus, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/i18n/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { displayName, displayCategory } from "@/lib/i18n-product";

export default function Dashboard() {
  const { t, lang } = useLang();
  const td = t.dashboard;
  const tc = t.cart;
  const tp = t.products;
  const isRtl = lang === "ar";
  const { addToCartWithQty, getQuantity } = useCart();
  const { toast } = useToast();
  const [justAdded, setJustAdded] = useState<Set<number>>(new Set());
  const [localQty, setLocalQty] = useState<Record<number, number>>({});

  const { data: stats, isLoading: statsLoading } = useGetProductStats({
    query: { queryKey: getGetProductStatsQueryKey() },
  });

  const { data: recentProducts, isLoading: productsLoading } = useListProducts(
    { sortBy: "createdAt", sortOrder: "desc" },
    { query: { queryKey: getListProductsQueryKey({ sortBy: "createdAt", sortOrder: "desc" }) } }
  );

  const getLocalQty = (id: number) => localQty[id] ?? 1;

  const adjustQty = (id: number, stock: number, delta: number) => {
    setLocalQty((prev) => {
      const current = prev[id] ?? 1;
      const next = Math.max(1, Math.min(stock, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const handleAddToCart = (product: NonNullable<typeof recentProducts>[number]) => {
    if (product.stock === 0) return;
    const qty = getLocalQty(product.id);
    addToCartWithQty(
      { id: product.id, name: product.name, nameAr: product.nameAr, price: product.price, imageUrl: product.imageUrl, category: product.category, categoryAr: product.categoryAr },
      qty
    );
    toast({ title: tc.addedToCart, description: tc.addedToCartDesc(displayName(product, lang)) });
    setJustAdded((prev) => {
      const next = new Set(prev);
      next.add(product.id);
      setTimeout(() => setJustAdded((s) => { const n = new Set(s); n.delete(product.id); return n; }), 1500);
      return next;
    });
  };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-violet-700 text-primary-foreground px-8 py-10 md:px-12 md:py-14">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {td.heroBadge}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
            {td.heroTitle}
          </h1>
          <p className="text-primary-foreground/80 text-base mb-6 max-w-lg">
            {td.heroSub}
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm shadow-lg"
          >
            {td.heroCta}
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>
        {/* Decorative blobs */}
        <div className="absolute -top-10 -end-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 end-12 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-4 end-32 opacity-10 pointer-events-none text-8xl font-black select-none">
          {isRtl ? "🛒" : "🛒"}
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Card key={i} className="animate-pulse bg-muted h-28" />)}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{td.totalValue}</CardTitle>
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">{td.totalValueSub}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{td.totalProducts}</CardTitle>
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">{td.totalProductsSub(stats.totalCategories)}</p>
            </CardContent>
          </Card>
          <Card className={cn("border-border/60", stats.outOfStockCount > 0 && "border-destructive/30 bg-destructive/5")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{td.outOfStock}</CardTitle>
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", stats.outOfStockCount > 0 ? "bg-destructive/10" : "bg-muted")}>
                <AlertTriangle className={cn("h-4 w-4", stats.outOfStockCount > 0 ? "text-destructive" : "text-muted-foreground")} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.outOfStockCount}</div>
              <p className="text-xs text-muted-foreground mt-1">{td.outOfStockSub}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Featured products */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">{td.recentProducts}</h2>
          <Link href="/products" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
            {td.viewAll}
          </Link>
        </div>

        {productsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : recentProducts && recentProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {recentProducts.slice(0, 8).map((product) => {
              const inCart = getQuantity(product.id);
              const added = justAdded.has(product.id);
              const qty = getLocalQty(product.id);
              const localProductName = displayName(product, lang);
              const localCat = displayCategory(product, lang);
              const isOos = product.stock === 0;

              return (
                <div
                  key={product.id}
                  className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg"
                >
                  <Link href={`/products/${product.id}`} className="block relative overflow-hidden bg-muted aspect-[4/3]">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={localProductName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="w-10 h-10 opacity-20" />
                      </div>
                    )}
                    {isOos && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive">{tp.outOfStock}</Badge>
                      </div>
                    )}
                    {inCart > 0 && !isOos && (
                      <div className="absolute top-2 end-2">
                        <Badge className="bg-primary text-primary-foreground shadow-md">{tc.alreadyInCart(inCart)}</Badge>
                      </div>
                    )}
                    <div className="absolute bottom-2 start-2">
                      <Badge variant="secondary" className="text-xs font-medium bg-black/60 text-white border-none backdrop-blur-sm">
                        {localCat}
                      </Badge>
                    </div>
                  </Link>

                  <div className="flex flex-col flex-1 p-4 gap-3">
                    <div className="flex-1">
                      <Link href={`/products/${product.id}`} className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
                        {localProductName}
                      </Link>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-primary">{formatCurrency(product.price)}</span>
                        <span className="text-xs text-muted-foreground">{tp.inStock(product.stock)}</span>
                      </div>
                    </div>

                    {!isOos && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">{tp.qty}:</span>
                        <div className="flex items-center border border-border rounded-lg overflow-hidden">
                          <button
                            onClick={() => adjustQty(product.id, product.stock, -1)}
                            disabled={qty <= 1}
                            className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-9 text-center text-sm font-semibold tabular-nums select-none">{qty}</span>
                          <button
                            onClick={() => adjustQty(product.id, product.stock, 1)}
                            disabled={qty >= product.stock}
                            className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <span className="text-base leading-none">+</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      disabled={isOos}
                      onClick={() => handleAddToCart(product)}
                      className={cn(
                        "w-full h-9 flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-all duration-300",
                        isOos
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : added
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-primary text-primary-foreground hover:opacity-90"
                      )}
                    >
                      {added
                        ? <><Check className="w-4 h-4" />{tc.addedToCart}</>
                        : isOos
                          ? tp.outOfStock
                          : <><ShoppingCart className="w-4 h-4" />{tc.addToCart}</>
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">{td.noProducts}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-4">{td.noProductsSub}</p>
            <Link href="/products/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
              {td.addProduct}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
