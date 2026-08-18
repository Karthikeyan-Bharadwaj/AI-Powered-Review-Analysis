import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import ResultsDisplay from "@/components/ResultsDisplay";
import { scrapeEbay, scrapeBestBuy, processProduct, getSummary, compareProducts } from "@/lib/api";

const Compare = () => {
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [comparingStep, setComparingStep] = useState<string>();
  const [showResults, setShowResults] = useState(false);
  const [comparisonSummary, setComparisonSummary] = useState("");
  const [product1, setProduct1] = useState({ id: "", summary: "" });
  const [product2, setProduct2] = useState({ id: "", summary: "" });

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url1.trim() || !url2.trim()) {
      toast.error("Please enter both product URLs");
      return;
    }

    const detectPlatform = (url: string) =>
      url.includes("ebay") ? "ebay" : url.includes("bestbuy") ? "bestbuy" : null;

    const platform1 = detectPlatform(url1);
    const platform2 = detectPlatform(url2);

    if (!platform1 || !platform2) {
      toast.error("Both URLs must be from eBay or BestBuy!");
      return;
    }

    setIsComparing(true);
    setShowResults(false);
    setComparisonSummary("");
    setProduct1({ id: "", summary: "" });
    setProduct2({ id: "", summary: "" });

    try {
      // Step 1 — Scrape both products
      setComparingStep("Fetching reviews for both products...");
      const data1 =
        platform1 === "ebay" ? await scrapeEbay(url1) : await scrapeBestBuy(url1);
      const data2 =
        platform2 === "ebay" ? await scrapeEbay(url2) : await scrapeBestBuy(url2);

      if (!data1?.reviews?.length || !data2?.reviews?.length) {
        toast.error("No reviews found for one or both products!");
        return;
      }

      const pid1 = data1.reviews[0].product_id;
      const pid2 = data2.reviews[0].product_id;

      // Step 2 — Run NLP processing
      setComparingStep("Analyzing sentiment for both products...");
      await processProduct(pid1);
      await processProduct(pid2);

      // Step 3 — Get AI summaries
      setComparingStep("Generating AI summaries...");
      const summary1 = await getSummary(pid1);
      const summary2 = await getSummary(pid2);

      // Step 4 — Compare via backend
      setComparingStep("Building side-by-side comparison...");
      const comp = await compareProducts(pid1, pid2, "Product 1", "Product 2");

      setProduct1({
        id: pid1,
        summary: summary1.summary || "No summary available.",
      });
      setProduct2({
        id: pid2,
        summary: summary2.summary || "No summary available.",
      });
      setComparisonSummary(comp.comparison || "No comparison available.");
      setShowResults(true);

      toast.success("Comparison complete!");
    } catch (error) {
      console.error("Compare failed:", error);
      toast.error("Something went wrong while comparing products.");
    } finally {
      setIsComparing(false);
      setComparingStep(undefined);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container mx-auto px-4 py-12 max-w-[1500px]">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text-blue">
              Compare Products
            </h1>
            <p className="text-muted-foreground text-lg">
              Compare two products side by side with AI-powered analysis
            </p>
          </div>

          {/* Form */}
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-border">
            <form onSubmit={handleCompare} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="url1" className="text-sm font-medium">
                    Product 1 URL
                  </label>
                  <Input
                    id="url1"
                    type="url"
                    placeholder="https://www.ebay.com/itm/..."
                    value={url1}
                    onChange={(e) => setUrl1(e.target.value)}
                    className="bg-input border-border focus:border-primary transition-colors"
                    disabled={isComparing}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="url2" className="text-sm font-medium">
                    Product 2 URL
                  </label>
                  <Input
                    id="url2"
                    type="url"
                    placeholder="https://www.bestbuy.com/site/..."
                    value={url2}
                    onChange={(e) => setUrl2(e.target.value)}
                    className="bg-input border-border focus:border-primary transition-colors"
                    disabled={isComparing}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="neon"
                size="xl"
                className="w-full"
                disabled={isComparing}
              >
                {isComparing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    {comparingStep || "Comparing Products..."}
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-5 h-5 mr-2" />
                    Compare Now
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Results */}
          {showResults && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                {/* Product 1 Panel */}
                <div className="space-y-4">
                  <Card className="p-4 bg-card/50 border border-border">
                    <h3 className="text-xl font-semibold mb-2 gradient-text-blue">Product 1</h3>
                    <p className="text-xs text-muted-foreground">ID: {product1.id || '—'}</p>
                  </Card>
                  <ResultsDisplay
                    show={true}
                    summary={product1.summary}
                    productId={product1.id}
                  />
                </div>

                {/* Product 2 Panel */}
                <div className="space-y-4">
                  <Card className="p-4 bg-card/50 border border-border">
                    <h3 className="text-xl font-semibold mb-2 gradient-text-orange">Product 2</h3>
                    <p className="text-xs text-muted-foreground">ID: {product2.id || '—'}</p>
                  </Card>
                  <ResultsDisplay
                    show={true}
                    summary={product2.summary}
                    productId={product2.id}
                  />
                </div>
              </div>

              {/* AI Comparison Summary (stretches full width) */}
              <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border">
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold flex items-center gap-2">
                    <ArrowLeftRight className="w-6 h-6 text-primary" />
                    AI Comparison Summary
                  </h3>
                  <p className="text-foreground/80 leading-relaxed text-sm md:text-base">
                    {comparisonSummary || "No comparison available. Please check if products have reviews."}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Compare;
