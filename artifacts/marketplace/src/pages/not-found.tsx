import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/i18n/LanguageContext";

export default function NotFound() {
  const { t } = useLang();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">{t.notFound.title}</h1>
          </div>
          <Link href="/" className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">
            {t.notFound.back}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
