import { useState } from "react";
import { useListProducts, usePurchaseProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Search, Filter, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Products() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Simple debounce
  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  });

  const queryParams = {
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder
  };

  const { data: products, isLoading } = useListProducts(
    queryParams,
    { query: { queryKey: getListProductsQueryKey(queryParams) } }
  );

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const purchaseProduct = usePurchaseProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: "Purchase successful", description: "Stock has been decremented." });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Purchase failed", description: err.error, variant: "destructive" });
      }
    }
  });

  const handlePurchase = (id: number) => {
    purchaseProduct.mutate({ id, data: { quantity: 1 } });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-2">Manage your marketplace inventory.</p>
        </div>
        <Link href="/products/new" className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">
          Add Product
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date Added</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="stock">Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map(product => (
            <Card key={product.id} className="overflow-hidden flex flex-col transition-all hover:border-primary/50 hover:shadow-md">
              <Link href={`/products/${product.id}`} className="block relative aspect-video bg-muted group">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Package className="w-8 h-8 opacity-20" />
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive">Out of Stock</Badge>
                  </div>
                )}
              </Link>
              <CardContent className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <Link href={`/products/${product.id}`} className="font-semibold truncate pr-2 hover:underline hover:text-primary transition-colors">
                    {product.name}
                  </Link>
                  <div className="font-medium text-primary whitespace-nowrap">{formatCurrency(product.price)}</div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <Badge variant="secondary" className="font-normal">{product.category}</Badge>
                  <span>{product.stock} in stock</span>
                </div>
                <div className="mt-auto pt-4 border-t border-border">
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    disabled={product.stock === 0 || purchaseProduct.isPending}
                    onClick={() => handlePurchase(product.id)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Purchase 1
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <Filter className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No products match your criteria</h3>
          <p className="text-muted-foreground max-w-sm mt-2 mb-4">Try adjusting your filters or search term.</p>
          <Button variant="outline" onClick={() => { setSearch(""); setSortBy("createdAt"); setSortOrder("desc"); }}>
            Clear Filters
          </Button>
        </Card>
      )}
    </div>
  );
}
