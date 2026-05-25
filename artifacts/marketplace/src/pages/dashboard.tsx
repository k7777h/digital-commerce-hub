import { useGetProductStats, useListProducts, getGetProductStatsQueryKey, getListProductsQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/i18n/LanguageContext";

export default function Dashboard() {
  const { t } = useLang();
  const td = t.dashboard;

  const { data: stats, isLoading: statsLoading } = useGetProductStats({
    query: { queryKey: getGetProductStatsQueryKey() }
  });

  const { data: recentProducts, isLoading: productsLoading } = useListProducts(
    { sortBy: "createdAt", sortOrder: "desc" },
    { query: { queryKey: getListProductsQueryKey({ sortBy: "createdAt", sortOrder: "desc" }) } }
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{td.title}</h1>
        <p className="text-muted-foreground mt-2">{td.subtitle}</p>
      </div>

      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse bg-muted h-32" />
          ))}
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
          <Link href="/products" className="text-sm text-primary hover:underline font-medium">
            {td.viewAll}
          </Link>
        </div>

        {productsLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : recentProducts && recentProducts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {recentProducts.slice(0, 8).map(product => (
              <Link key={product.id} href={`/products/${product.id}`} className="block group">
                <Card className="h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
                  <div className="aspect-video w-full bg-muted relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="w-8 h-8 opacity-20" />
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute top-2 end-2">
                        <Badge variant="destructive">{t.products.outOfStock}</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold truncate pe-2">{product.name}</h3>
                      <div className="font-medium text-primary whitespace-nowrap">{formatCurrency(product.price)}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant="secondary" className="font-normal">{product.category}</Badge>
                      <span>{t.products.inStock(product.stock)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
