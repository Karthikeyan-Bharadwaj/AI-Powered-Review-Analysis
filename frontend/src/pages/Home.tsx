import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Link2, ScanSearch, ClipboardCheck } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import Navigation from "@/components/Navigation";

const steps = [
  {
    icon: Link2,
    title: "Paste a product link",
    description: "Any eBay or BestBuy product URL. No sign-up, no setup.",
  },
  {
    icon: ScanSearch,
    title: "It reads every review",
    description: "The reviews get scraped and scored for sentiment, one by one.",
  },
  {
    icon: ClipboardCheck,
    title: "You get a plain summary",
    description: "What people liked, what they didn't, and why.",
  },
];

const features = [
  {
    icon: ScanSearch,
    title: "Sentiment breakdown",
    description: "Every review is marked positive, neutral, or negative, then counted into a chart so you can see the split at a glance.",
  },
  {
    icon: ClipboardCheck,
    title: "Topic breakdown",
    description: "Reviews are grouped by what they're actually about — price, quality, delivery, and more — so you can see opinions per topic.",
  },
  {
    icon: Link2,
    title: "Side-by-side comparison",
    description: "Paste two product links and see both review breakdowns next to each other.",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Hero */}
        <section className="text-center space-y-6 mb-20">
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 rounded-md border border-border bg-muted text-muted-foreground text-sm">
              Free — no account needed
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold text-foreground leading-tight">
              Understand product reviews faster
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Paste a product link from eBay or BestBuy. Get the reviews sorted into
              positive, neutral, and negative, plus a short summary of what people said.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link to="/ebay" className="w-full sm:w-auto">
              <Button variant="solid" size="xl" className="w-full sm:w-auto px-6 sm:px-10 group">
                Analyze eBay Reviews
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/bestbuy" className="w-full sm:w-auto">
              <Button variant="outline" size="xl" className="w-full sm:w-auto px-6 sm:px-10 group">
                Analyze BestBuy Reviews
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Real screenshot */}
        <section className="mb-20">
          <div className="max-w-3xl mx-auto">
            <img
              src="/example-sentiment-chart.jpg"
              alt="Screenshot of the sentiment distribution chart after analyzing a real eBay product's reviews"
              className="w-full rounded-lg border border-border shadow-[var(--shadow-card)]"
              loading="lazy"
            />
            <p className="text-center text-sm text-muted-foreground mt-3">
              A real result: 15 eBay reviews analyzed, split into positive, neutral, and negative.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-10 mb-20">
          <h2 className="text-2xl font-bold text-center text-foreground">How it works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div key={step.title} className="flex flex-col items-start gap-3 p-5 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <step.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Step {index + 1}</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What it does */}
        <section className="space-y-10">
          <h2 className="text-2xl font-bold text-center text-foreground">What it does</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; 2026 AI Review Analyzer.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
