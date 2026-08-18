import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, Brain, BarChart3, ArrowRight, Link2, Sparkles, ClipboardCheck } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import Navigation from "@/components/Navigation";

const steps = [
  {
    icon: Link2,
    title: "Paste a product link",
    description: "Drop in any eBay or BestBuy product URL — no sign-up, no setup.",
  },
  {
    icon: Sparkles,
    title: "AI reads every review",
    description: "We scrape the reviews and run sentiment & aspect analysis in seconds.",
  },
  {
    icon: ClipboardCheck,
    title: "Get a clear verdict",
    description: "See what people love, what they don't, and a plain-English summary.",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center space-y-8 mb-24">
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Free AI review analysis, no account needed
            </div>
            <h1 className="text-5xl md:text-7xl font-bold gradient-text-blue leading-tight">
              AI-Powered Review Intelligence
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Analyze thousands of product reviews instantly using AI to make smarter purchase decisions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <Link to="/ebay">
              <Button variant="neon" size="xl" className="group">
                Analyze eBay Reviews
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/bestbuy">
              <Button variant="neonOrange" size="xl" className="group">
                Analyze BestBuy Reviews
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-12 mb-24">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
            <p className="text-muted-foreground text-lg">From link to insight in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 relative">
            {steps.map((step, index) => (
              <div key={step.title} className="relative flex flex-col items-center text-center gap-4 px-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-sm max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Powerful Features</h2>
            <p className="text-muted-foreground text-lg">Everything you need to make informed decisions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <FeatureCard
              icon={Zap}
              title="Instant Sentiment Detection"
              description="Get immediate insights into customer satisfaction with advanced AI sentiment analysis"
            />
            <FeatureCard
              icon={Brain}
              title="AI-Powered Insights"
              description="Understand review patterns and trends with machine learning algorithms"
            />
            <FeatureCard
              icon={BarChart3}
              title="Smart Comparison"
              description="Compare products side-by-side with intelligent review aggregation"
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 AI Review Analyzer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
