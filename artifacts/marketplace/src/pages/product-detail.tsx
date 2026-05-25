import { useParams, useLocation } from "wouter";
import {
  useGetProduct, useUpdateProduct, useDeleteProduct, usePurchaseProduct,
  getGetProductQueryKey, getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, ArrowRight, Trash2, ShoppingCart, Package, Check } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLang } from "@/i18n/LanguageContext";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { displayName, displayDescription, displayCategory } from "@/lib/i18n-product";

export default function ProductDetail() {
  const { id } = useParams();
  const productId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, lang } = useLang();
  const td = t.productDetail;
  const tc = t.cart;
  const isRtl = lang === "ar";
  const { addToCart, getQuantity } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "", nameAr: "", description: "", descriptionAr: "",
    price: 0, stock: 0, category: "", categoryAr: "", imageUrl: "",
  });

  useEffect(() => {
    if (product && !isEditing) {
      setFormData({
        name: product.name,
        nameAr: product.nameAr ?? "",
        description: product.description,
        descriptionAr: product.descriptionAr ?? "",
        price: product.price,
        stock: product.stock,
        category: product.category,
        categoryAr: product.categoryAr ?? "",
        imageUrl: product.imageUrl || "",
      });
    }
  }, [product, isEditing]);

  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: (data) => {
        toast({ title: td.toastUpdated, description: td.toastUpdatedDesc });
        setIsEditing(false);
        queryClient.setQueryData(getGetProductQueryKey(productId), data);
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
      onError: (err) => toast({ title: td.toastUpdateFailed, description: err.error, variant: "destructive" }),
    },
  });

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        toast({ title: td.toastDeleted, description: td.toastDeletedDesc });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setLocation("/products");
      },
      onError: (err) => toast({ title: td.toastDeleteFailed, description: err.error, variant: "destructive" }),
    },
  });

  const purchaseProduct = usePurchaseProduct({
    mutation: {
      onSuccess: (data) => {
        toast({ title: td.toastPurchased, description: td.toastPurchasedDesc });
        queryClient.setQueryData(getGetProductQueryKey(productId), data);
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
      onError: (err) => toast({ title: td.toastPurchaseFailed, description: err.error, variant: "destructive" }),
    },
  });

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    addToCart({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, category: product.category });
    toast({ title: tc.addedToCart, description: tc.addedToCartDesc(displayName(product, lang)) });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center p-12">
        <h2 className="text-2xl font-bold">{td.notFound}</h2>
        <Button asChild className="mt-4"><Link href="/products">{td.backToProducts}</Link></Button>
      </div>
    );
  }

  const handleSave = () => {
    updateProduct.mutate({
      id: productId,
      data: {
        name: formData.name,
        nameAr: formData.nameAr || undefined,
        description: formData.description,
        descriptionAr: formData.descriptionAr || undefined,
        price: formData.price,
        stock: formData.stock,
        category: formData.category,
        categoryAr: formData.categoryAr || undefined,
        imageUrl: formData.imageUrl || undefined,
      }
    });
  };

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const qty = getQuantity(product.id);
  const localName = displayName(product, lang);
  const localDescription = displayDescription(product, lang);
  const localCategory = displayCategory(product, lang);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products" className="p-2 rounded-full hover:bg-muted transition-colors">
            <BackIcon className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{localName}</h1>
              {product.stock === 0 && <Badge variant="destructive">{td.outOfStock}</Badge>}
              {qty > 0 && (
                <Badge className="bg-primary/10 text-primary border-primary/20">{tc.alreadyInCart(qty)}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{td.addedOn(formatDate(product.createdAt))}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground">
                <Trash2 className="w-4 h-4 me-2" />{td.delete}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{td.deleteTitle}</AlertDialogTitle>
                <AlertDialogDescription>{td.deleteDesc(localName)}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{td.deleteCancelLabel}</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteProduct.mutate({ id: productId })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleteProduct.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                  {td.deleteConfirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            variant="outline"
            className={cn("transition-all duration-300", justAdded && "bg-green-600 border-green-600 text-white hover:bg-green-700")}
          >
            {justAdded
              ? <><Check className="w-4 h-4 me-2" />{tc.addedToCart}</>
              : <><ShoppingCart className="w-4 h-4 me-2" />{td.addToCart}</>
            }
          </Button>

          <Button
            onClick={() => purchaseProduct.mutate({ id: productId, data: { quantity: 1 } })}
            disabled={product.stock === 0 || purchaseProduct.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {purchaseProduct.isPending ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 me-2" />}
            {td.simulatePurchase}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>{td.productDetails}</CardTitle>
                <CardDescription>{td.productDetailsDesc}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                if (isEditing) {
                  setFormData({
                    name: product.name, nameAr: product.nameAr ?? "",
                    description: product.description, descriptionAr: product.descriptionAr ?? "",
                    price: product.price, stock: product.stock,
                    category: product.category, categoryAr: product.categoryAr ?? "",
                    imageUrl: product.imageUrl || "",
                  });
                }
                setIsEditing(!isEditing);
              }}>
                {isEditing ? td.cancel : td.edit}
              </Button>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{td.labelName} (EN)</Label>
                      <Input value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{td.labelName} (AR)</Label>
                      <Input value={formData.nameAr} onChange={(e) => setFormData((f) => ({ ...f, nameAr: e.target.value }))} dir="rtl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{td.labelDescription} (EN)</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))} className="min-h-[80px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>{td.labelDescription} (AR)</Label>
                    <Textarea value={formData.descriptionAr} onChange={(e) => setFormData((f) => ({ ...f, descriptionAr: e.target.value }))} className="min-h-[80px]" dir="rtl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{td.labelPrice}</Label>
                      <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{td.labelStock}</Label>
                      <Input type="number" step="1" value={formData.stock} onChange={(e) => setFormData((f) => ({ ...f, stock: parseInt(e.target.value, 10) || 0 }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{td.labelCategory} (EN)</Label>
                      <Input value={formData.category} onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{td.labelCategory} (AR)</Label>
                      <Input value={formData.categoryAr} onChange={(e) => setFormData((f) => ({ ...f, categoryAr: e.target.value }))} dir="rtl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{td.labelImageUrl}</Label>
                    <Input value={formData.imageUrl} onChange={(e) => setFormData((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div className="pt-4 border-t flex justify-end">
                    <Button onClick={handleSave} disabled={updateProduct.isPending}>
                      {updateProduct.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                      {td.saveChanges}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">{td.labelDescription}</h3>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{localDescription}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">{td.labelPrice}</h3>
                      <p className="text-lg font-semibold">{formatCurrency(product.price)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">{td.labelStockLevel}</h3>
                      <p className="text-lg font-semibold">{product.stock} {td.units}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">{td.labelCategory}</h3>
                      <Badge variant="secondary">{localCategory}</Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">{td.labelTotalValue}</h3>
                      <p className="text-lg font-semibold text-primary">{formatCurrency(product.price * product.stock)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="overflow-hidden">
            <div className="aspect-square bg-muted relative">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={localName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                  <Package className="w-16 h-16 opacity-20 mb-4" />
                  <p className="text-sm opacity-50">{td.noImage}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
