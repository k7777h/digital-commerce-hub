import { useState, useMemo } from "react";
import { useListProducts, useListCategories, getListProductsQueryKey, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Search, ShoppingCart, Check, Minus, BookOpen, Code2, GraduationCap, LayoutGrid, Filter } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/i18n/LanguageContext";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { displayName, displayCategory } from "@/lib/i18n-product";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Courses: GraduationCap,
  Books: BookOpen,
  Templates: Code2,
  "دورات": GraduationCap,
  "كتب": BookOpen,
  "قوالب": Code2,
};

export default function Products() {
  const { t, lang } = useLang();
  const tp = t.products;
  const tc = t.cart;
  const isRtl = lang === "ar";

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [localQty, setLocalQty] = useState<Record<number, number>>({});
  const [justAdded, setJustAdded] = useState<Set<number>>(new Set());

  const queryParams = { sortBy: "createdAt" as const, sortOrder: "desc" as const };
  const { data: allProducts, isLoading } = useListProducts(queryParams, {
    query: { queryKey: getListProductsQueryKey(queryParams) },
  });

  const { data: categoriesRaw } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  const { toast } = useToast();
  const { addToCartWithQty, getQuantity } = useCart();

  // Filter products client-side for instant feedback
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter((p) => {
      const name = displayName(p, lang).toLowerCase();
      const cat = displayCategory(p, lang);
      const matchesSearch = !search || name.includes(search.toLowerCase()) || cat.toLowerCase().includes(search.toLowerCase());
      const matchesCat = !activeCategory || p.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [allProducts, search, activeCategory, lang]);

  const getLocalQty = (id: number) => localQty[id] ?? 1;

  const adjustQty = (id: number, stock: number, delta: number) => {
    setLocalQty((prev) => {
      const current = prev[id] ?? 1;
      const next = Math.max(1, Math.min(stock, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const handleAddToCart = (product: NonNullable<typeof allProducts>[number]) => {
    if (product.stock === 0) return;
    const qty = getLocalQty(product.id);
    addToCartWithQty(
      { id: product.id, name: product.name, nameAr: product.nameAr, price: product.price, imageUrl: product.imageUrl, category: product.category, categoryAr: product.categoryAr },
      qty
    );
    const localProductName = displayName(product, lang);
    toast({ title: tc.addedToCart, description: tc.addedToCartDesc(localProductName) });
    setJustAdded((prev) => {
      const next = new Set(prev);
      next.add(product.id);
      setTimeout(() => setJustAdded((s) => { const n = new Set(s); n.delete(product.id); return n; }), 1500);
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tp.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{tp.subtitle}</p>
        </div>
        <Link href="/products/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <span className="text-base leading-none">+</span>
          {tp.addProduct}
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={tp.searchPlaceholder}
          className="ps-9 h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-border transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
            !activeCategory
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
          )}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          {tp.allCategories}
          {allProducts && (
            <span className={cn("text-xs px-1.5 py-0.5 rounded-full", !activeCategory ? "bg-white/20" : "bg-muted")}>
              {allProducts.length}
            </span>
          )}
        </button>
        {categoriesRaw?.map((cat) => {
          const displayCatName = isRtl && (cat as any).nameAr ? (cat as any).nameAr : cat.name;
          const Icon = CATEGORY_ICONS[cat.name] ?? Filter;
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(isActive ? null : cat.name)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {displayCatName}
              <span className={cn("text-xs px-1.5 py-0.5 rounded-full", isActive ? "bg-white/20" : "bg-muted")}>
                {cat.productCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          {filteredProducts.length} {lang === "ar" ? "منتج" : "products"}
          {activeCategory && ` — ${isRtl && categoriesRaw ? ((categoriesRaw.find(c => c.name === activeCategory) as any)?.nameAr ?? activeCategory) : activeCategory}`}
        </p>
      )}

      {/* Product grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
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
                {/* Product image */}
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
                  {/* Overlays */}
                  {isOos && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-sm px-3">{tp.outOfStock}</Badge>
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

                {/* Card body */}
                <div className="flex flex-col flex-1 p-4 gap-3">
                  {/* Name + price */}
                  <div className="flex-1">
                    <Link href={`/products/${product.id}`} className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
                      {localProductName}
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-primary">{formatCurrency(product.price)}</span>
                      <span className="text-xs text-muted-foreground">{tp.inStock(product.stock)}</span>
                    </div>
                  </div>

                  {/* Quantity selector */}
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
                        <span className="w-9 text-center text-sm font-semibold tabular-nums select-none">
                          {qty}
                        </span>
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

                  {/* Add to cart button */}
                  <Button
                    onClick={() => handleAddToCart(product)}
                    disabled={isOos}
                    className={cn(
                      "w-full h-9 text-sm font-semibold rounded-xl transition-all duration-300",
                      added
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                        : isOos
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                    )}
                    variant={added ? "default" : "default"}
                  >
                    {added
                      ? <><Check className="w-4 h-4 me-1.5" />{tc.addedToCart}</>
                      : isOos
                        ? tp.outOfStock
                        : <><ShoppingCart className="w-4 h-4 me-1.5" />{tp.purchase}</>
                    }
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package className="w-14 h-14 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-semibold">{tp.noMatch}</h3>
          <p className="text-sm text-muted-foreground max-w-xs mt-2 mb-6">{tp.noMatchSub}</p>
          <Button variant="outline" onClick={() => { setSearch(""); setActiveCategory(null); }}>
            {tp.clearFilters}
          </Button>
        </div>
      )}
    </div>
  );
}
