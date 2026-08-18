import { useState } from "react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import AnalyzerForm from "@/components/AnalyzerForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import { scrapeBestBuy, processProduct, getSummary } from "@/lib/api";

const BestBuyAnalyzer = () => {
  const [showResults, setShowResults] = useState(false);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>();
  const [productId, setProductId] = useState<string | null>(null);

  const handleAnalyze = async (url: string) => {
    setLoading(true);
    setShowResults(false);
    setSummary("");
    setProductId(null);

    try {
      // Step 1: Scrape BestBuy reviews
      setLoadingStep("Fetching BestBuy reviews...");
      const data = await scrapeBestBuy(url);

      if (!data?.reviews?.length) {
        toast.error("No reviews found for this product. Try a different URL or SKU.");
        return;
      }

      const pid = data.reviews[0].product_id;
      setProductId(pid);

      // Step 2: Run NLP processing
      setLoadingStep("Analyzing sentiment...");
      await processProduct(pid);

      // Step 3: Get AI summary
      setLoadingStep("Generating AI summary...");
      const summaryData = await getSummary(pid);

      setSummary(summaryData.summary || "No summary available.");
      setShowResults(true);
      toast.success(`Analyzed ${data.count} review${data.count === 1 ? "" : "s"}!`);
    } catch (error) {
      console.error("BestBuy analysis failed:", error);
      toast.error("Something went wrong while analyzing the BestBuy product. Please try again.");
    } finally {
      setLoading(false);
      setLoadingStep(undefined);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-12">
          <AnalyzerForm
            platform="bestbuy"
            onAnalyze={handleAnalyze}
            isLoading={loading}
            loadingStep={loadingStep}
          />

          {productId && (
            <ResultsDisplay
              show={showResults}
              summary={summary}
              productId={productId}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default BestBuyAnalyzer;
