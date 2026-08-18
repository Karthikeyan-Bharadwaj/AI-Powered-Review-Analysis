import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

interface AnalyzerFormProps {
  platform: "ebay" | "bestbuy";
  onAnalyze: (url: string) => void;
  isLoading?: boolean;
  loadingStep?: string;
}

const platformConfig = {
  ebay: {
    title: "eBay Review Analyzer",
    subtitle: "Analyze eBay product reviews",
    placeholder: "https://www.ebay.com/itm/...",
  },
  bestbuy: {
    title: "BestBuy Review Analyzer",
    subtitle: "Analyze BestBuy product reviews",
    placeholder: "https://www.bestbuy.com/site/...",
  },
};

const AnalyzerForm = ({ platform, onAnalyze, isLoading = false, loadingStep }: AnalyzerFormProps) => {
  const [url, setUrl] = useState("");
  const config = platformConfig[platform];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error("Please enter a product URL");
      return;
    }

    onAnalyze(url.trim());
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          {config.title}
        </h1>
        <p className="text-muted-foreground">{config.subtitle}</p>
      </div>

      <Card className="p-4 sm:p-8 bg-card border-border shadow-[var(--shadow-card)]">
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
            variant="solid"
            size="xl"
            className="w-full px-6 sm:px-12"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                {loadingStep || "Analyzing..."}
              </>
            ) : (
              <>Analyze Reviews</>
            )}
          </Button>

          {isLoading && (
            <p className="text-center text-xs text-muted-foreground">
              This can take up to a minute for a fresh product.
            </p>
          )}
        </form>
      </Card>
    </div>
  );
};

export default AnalyzerForm;
