import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

interface AnalyzerFormProps {
  onAnalyze: (url: string) => void;
  isLoading?: boolean;
  loadingStep?: string;
}

const AnalyzerForm = ({ onAnalyze, isLoading = false, loadingStep }: AnalyzerFormProps) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error("Please enter a product URL");
      return;
    }

    onAnalyze(url.trim());
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold gradient-text-blue">
          eBay Review Analyzer
        </h1>
        <p className="text-muted-foreground text-lg">Analyze eBay product reviews with AI</p>
      </div>

      <Card className="p-8 bg-card/50 backdrop-blur-sm border-border shadow-[var(--shadow-card)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="product-url" className="text-sm font-medium">
              Product URL
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="product-url"
                type="url"
                placeholder="https://www.ebay.com/itm/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-input border-border focus:border-primary transition-colors pl-9"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="neon"
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
            <p className="text-center text-xs text-primary animate-pulse">
              This can take up to a minute for a fresh product — hang tight while we fetch and read every review.
            </p>
          )}
        </form>
      </Card>
    </div>
  );
};

export default AnalyzerForm;
