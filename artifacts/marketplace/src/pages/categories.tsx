import { useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Folders, Package, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

export default function Categories() {
  const { t, lang } = useLang();
  const tc = t.categories;
  const isRtl = lang === "ar";

  const { data: categories, isLoading } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{tc.title}</h1>
        <p className="text-muted-foreground mt-2">{tc.subtitle}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const displayCatName = isRtl && (category as any).nameAr
              ? (category as any).nameAr
              : category.name;
            return (
              <Link key={category.name} href={`/products?category=${encodeURIComponent(category.name)}`} className="block group">
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Folders className="w-5 h-5" />
                    </div>
                    {isRtl
                      ? <ChevronLeft className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0" />
                      : <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                    }
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="mb-2">{displayCatName}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <Package className="w-4 h-4" />
                      <span>{tc.productCount(category.productCount)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <Folders className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">{tc.empty}</h3>
          <p className="text-muted-foreground max-w-sm mt-2 mb-4">{tc.emptySub}</p>
          <Link href="/products/new" className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">
            {tc.addProduct}
          </Link>
        </Card>
      )}
    </div>
  );
}
