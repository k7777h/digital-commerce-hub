import { useState } from "react";
import { useGetProductStats, useListProducts, getGetProductStatsQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, DollarSign, Loader2, ShoppingCart, Check } from "lucide-react";
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
  const { addToCart, getQuantity } = useCart();
  const { toast } = useToast();
  const [justAdded, setJustAdded] = useState<Set<number>>(new Set());

  const { data: stats, isLoading: statsLoading } = useGetProductStats({
    query: { queryKey: getGetProductStatsQueryKey() },
  });

  const { data: recentProducts, isLoading: productsLoading } = useListProducts(
    { sortBy: "createdAt", sortOrder: "desc" },
    { query: { queryKey: getListProductsQueryKey({ sortBy: "createdAt", sortOrder: "desc" }) } }
  );

  const handleAddToCart = (product: NonNullable<typeof recentProducts>[number]) => {
    if (product.stock === 0) return;
    addToCart({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, category: product.category });
    toast({ title: tc.addedToCart, description: tc.addedToCartDesc(displayName(product, lang)) });
    setJustAdded((prev) => {
      const next = new Set(prev);
      next.add(product.id);
      setTimeout(() => setJustAdded((s) => { const n = new Set(s); n.delete(product.id); return n; }), 1500);
      return next;
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{td.title}</h1>
        <p className="text-muted-foreground mt-2">{td.subtitle}</p>
      </div>

      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Card key={i} className="animate-pulse bg-muted h-32" />)}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{td.totalValue}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">{td.totalValueSub}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{td.totalProducts}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">{td.totalProductsSub(stats.totalCategories)}</p>
            </CardContent>
          </Card>
          <Card className={stats.outOfStockCount > 0 ? "border-destructive/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{td.outOfStock}</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${stats.outOfStockCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.outOfStockCount}</div>
              <p className="text-xs text-muted-foreground mt-1">{td.outOfStockSub}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">{td.recentProducts}</h2>
          <Link href="/products" className="text-sm text-primary hover:underline font-medium">{td.viewAll}</Link>
        </div>

        {productsLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : recentProducts && recentProducts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {recentProducts.slice(0, 8).map((product) => {
              const qty = getQuantity(product.id);
              const added = justAdded.has(product.id);
              const localName = displayName(product, lang);
              const localCategory = displayCategory(product, lang);
              return (
                <Card key={product.id} className="h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-md flex flex-col">
                  <Link href={`/products/${product.id}`} className="block group relative">
                    <div className="aspect-video w-full bg-muted relative">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={localName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Package className="w-8 h-8 opacity-20" />
                        </div>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute top-2 end-2"><Badge variant="destructive">{t.products.outOfStock}</Badge></div>
                      )}
                      {qty > 0 && (
                        <div className="absolute top-2 start-2">
                          <Badge className="bg-primary text-primary-foreground">{tc.alreadyInCart(qty)}</Badge>
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold truncate pe-2">{localName}</h3>
                      <div className="font-medium text-primary whitespace-nowrap">{formatCurrency(product.price)}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <Badge variant="secondary" className="font-normal">{localCategory}</Badge>
                      <span>{t.products.inStock(product.stock)}</span>
                    </div>
                    <div className="mt-auto pt-3 border-t border-border">
                      <button
                        disabled={product.stock === 0}
                        onClick={() => handleAddToCart(product)}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium border transition-all duration-300",
                          product.stock === 0
                            ? "opacity-40 cursor-not-allowed border-border text-muted-foreground"
                            : added
                              ? "bg-green-600 border-green-600 text-white hover:bg-green-700"
                              : "border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        )}
                      >
                        {added
                          ? <><Check className="w-3.5 h-3.5" />{tc.addedToCart}</>
                          : <><ShoppingCart className="w-3.5 h-3.5" />{tc.addToCart}</>
                        }
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 flex flex-col items-center justify-center text-center">
            <Package className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">{td.noProducts}</h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-4">{td.noProductsSub}</p>
            <Link href="/products/new" className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">
              {td.addProduct}
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
