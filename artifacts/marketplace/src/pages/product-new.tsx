import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/i18n/LanguageContext";

export default function ProductNew() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, lang } = useLang();
  const tn = t.productNew;
  const isRtl = lang === "ar";

  const formSchema = z.object({
    name: z.string().min(1, tn.validName),
    description: z.string().min(1, tn.validDesc),
    price: z.coerce.number().min(0, tn.validPrice),
    stock: z.coerce.number().int().min(0, tn.validStock),
    category: z.string().min(1, tn.validCategory),
    imageUrl: z.string().url().optional().or(z.literal("")),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "",
      imageUrl: "",
    },
  });

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: (product) => {
        toast({ title: tn.toastCreated, description: tn.toastCreatedDesc });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setLocation(`/products/${product.id}`);
      },
      onError: (err) => {
        toast({ title: tn.toastFailed, description: err.error, variant: "destructive" });
      }
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createProduct.mutate({
      data: {
        ...values,
        imageUrl: values.imageUrl || undefined,
      }
    });
  }

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/products" className="p-2 rounded-full hover:bg-muted transition-colors">
          <BackIcon className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tn.title}</h1>
          <p className="text-muted-foreground mt-1">{tn.subtitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tn.cardTitle}</CardTitle>
          <CardDescription>{tn.cardDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tn.labelName}</FormLabel>
                    <FormControl>
                      <Input placeholder={tn.placeholderName} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tn.labelDesc}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={tn.placeholderDesc} className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tn.labelPrice}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tn.labelStock}</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tn.labelCategory}</FormLabel>
                      <FormControl>
                        <Input placeholder={tn.placeholderCategory} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tn.labelImageUrl}</FormLabel>
                      <FormControl>
                        <Input placeholder={tn.placeholderImage} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Link href="/products" className="inline-flex items-center justify-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium">
                  {tn.cancel}
                </Link>
                <Button type="submit" disabled={createProduct.isPending}>
                  {createProduct.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                  {tn.create}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
