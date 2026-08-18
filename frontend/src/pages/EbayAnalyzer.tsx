import { useState } from "react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import AnalyzerForm from "@/components/AnalyzerForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import { scrapeEbay, processProduct, getSummary } from "@/lib/api";

const EbayAnalyzer = () => {
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
      // Step 1: Scrape reviews
      setLoadingStep("Fetching eBay reviews...");
      const data = await scrapeEbay(url);
      if (!data?.reviews?.length) {
        toast.error("No reviews found for this product.");
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
      console.error("Analysis failed:", error);
      toast.error("Something went wrong while analyzing the product. Please try again.");
    } finally {
      setLoading(false);
      setLoadingStep(undefined);
    }
  };

  return (
    <div className="min-h-screen text-white bg-gradient-to-b from-[#020617] to-[#0f172a]">
      <Navigation />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-12">
          <AnalyzerForm
            platform="ebay"
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

export default EbayAnalyzer;
