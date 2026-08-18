import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AnalyzerFormProps {
  platform: "ebay" | "bestbuy";
  onAnalyze: (url: string) => void;
  isLoading?: boolean;
  loadingStep?: string;
}

const AnalyzerForm = ({ platform, onAnalyze, isLoading = false, loadingStep }: AnalyzerFormProps) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error("Please enter a product URL");
      return;
    }

    onAnalyze(url.trim());
  };

  const platformConfig = {
    ebay: {
      title: "eBay Review Analyzer",
      subtitle: "Analyze eBay product reviews with AI",
      buttonVariant: "neon" as const,
      accent: "text-primary",
      placeholder: "https://www.ebay.com/itm/...",
    },
    bestbuy: {
      title: "BestBuy Review Analyzer",
      subtitle: "Analyze BestBuy product reviews with AI",
      buttonVariant: "neonOrange" as const,
      accent: "text-secondary",
      placeholder: "https://www.bestbuy.com/site/...",
    },
  };

  const config = platformConfig[platform];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className={`text-4xl md:text-5xl font-bold ${platform === "ebay" ? "gradient-text-blue" : "gradient-text-orange"}`}>
          {config.title}
        </h1>
        <p className="text-muted-foreground text-lg">{config.subtitle}</p>
      </div>

      <Card className="p-8 bg-card/50 backdrop-blur-sm border-border shadow-[var(--shadow-card)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor={`product-url-${platform}`} className="text-sm font-medium">
              Product URL
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id={`product-url-${platform}`}
                type="url"
                placeholder={config.placeholder}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-input border-border focus:border-primary transition-colors pl-9"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant={config.buttonVariant}
            size="xl"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                {loadingStep || "Analyzing Reviews..."}
              </>
            ) : (
              <>Analyze Reviews</>
            )}
          </Button>

          {isLoading && (
            <p className={cn("text-center text-xs text-muted-foreground animate-pulse", config.accent)}>
              This can take up to a minute for a fresh product — hang tight while we fetch and read every review.
            </p>
          )}
        </form>
      </Card>
    </div>
  );
};

export default AnalyzerForm;
