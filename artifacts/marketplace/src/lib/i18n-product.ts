import type { Lang } from "@/i18n/translations";

interface BilingualProduct {
  name: string;
  nameAr?: string | null;
  description: string;
  descriptionAr?: string | null;
  category: string;
  categoryAr?: string | null;
}

export function displayName(product: BilingualProduct, lang: Lang): string {
  return lang === "ar" && product.nameAr ? product.nameAr : product.name;
}

export function displayDescription(product: BilingualProduct, lang: Lang): string {
  return lang === "ar" && product.descriptionAr ? product.descriptionAr : product.description;
}

export function displayCategory(product: BilingualProduct, lang: Lang): string {
  return lang === "ar" && product.categoryAr ? product.categoryAr : product.category;
}
