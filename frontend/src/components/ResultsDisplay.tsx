import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fetchProcessedData } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

interface ResultsDisplayProps {
  show: boolean;
  sentiment?: string;
  summary?: string;
  productId?: string;
}

export default function ResultsDisplay({
  show,
  sentiment,
  summary,
  productId,
}: ResultsDisplayProps) {
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [aspectChartData, setAspectChartData] = useState<any[]>([]);
  const [aspectsRaw, setAspectsRaw] = useState<Record<string, any>>({});
  const [topPositive, setTopPositive] = useState<any[]>([]);
  const [topNegative, setTopNegative] = useState<any[]>([]);
  const [expandedPos, setExpandedPos] = useState<Record<number, boolean>>({});
  const [expandedNeg, setExpandedNeg] = useState<Record<number, boolean>>({});
  const [aspectExamples, setAspectExamples] = useState<
    Record<string, { Positive: any[]; Neutral: any[]; Negative: any[] }>
  >({});
  const [expandedAspect, setExpandedAspect] = useState<Record<string, boolean>>({});
  const [selectedAspect, setSelectedAspect] = useState<string>("");
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

useEffect(() => {
  if (!productId) return;

  let isFetched = false;

  const fetchNLPData = async () => {
    if (isFetched) return;
    isFetched = true;
    setIsLoadingInsights(true);
    setInsightsError(null);
    try {
      const data = await fetchProcessedData(productId);

      if (data.error) throw new Error(data.error);
      console.log("Fetched NLP Data:", data);

      // Sentiment data for pie chart
      const sents = data.sentiments || {};
      const sentimentArray = Object.entries(sents).map(([key, value]) => ({
        name: key,
        value,
      }));
      setSentimentData(sentimentArray);

      // Aspect data for bar chart
      const aspects = data.aspects || {};
      const aspectArray = Object.entries(aspects).map(
        ([aspect, values]: any) => ({
          aspect,
          Positive: values.Positive,
          Neutral: values.Neutral,
          Negative: values.Negative,
        })
      );
      setAspectChartData(aspectArray);
      setAspectsRaw(aspects);
      const aspectKeys = Object.keys(aspects || {});
      setSelectedAspect((prev) => prev || (aspectKeys.sort()[0] || ""));

      // Top positive & negative
      setTopPositive(data.top_positive || []);
      setTopNegative(data.top_negative || []);

      // Aspect-based examples
      setAspectExamples(data.aspect_examples || {});
    } catch (error) {
      console.error("Error fetching NLP data:", error);
      setInsightsError("We couldn't load the detailed sentiment breakdown. The summary below is still accurate.");
    } finally {
      setIsLoadingInsights(false);
    }
  };

  fetchNLPData();
}, [productId]);


  if (!show) return null;

  const COLORS = ["#16a34a", "#ca8a04", "#dc2626"];

  const dominantSentiment = sentimentData.length
    ? sentimentData.reduce((max, cur) => (cur.value > max.value ? cur : max), sentimentData[0]).name
    : sentiment;

  const sentimentStyles: Record<string, string> = {
    Positive: "bg-green-50 text-green-700 border-green-300",
    Neutral: "bg-yellow-50 text-yellow-700 border-yellow-300",
    Negative: "bg-red-50 text-red-700 border-red-300",
  };

  return (
    <div className="space-y-10 bg-card p-8 rounded-xl border border-border shadow-[var(--shadow-card)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-3xl font-bold text-foreground">AI Insights</h2>
        {dominantSentiment && (
          <span
            className={cn(
              "text-sm font-semibold px-4 py-1.5 rounded-full border",
              sentimentStyles[dominantSentiment] || "bg-muted text-foreground border-border"
            )}
          >
            Overall: {dominantSentiment}
          </span>
        )}
      </div>

      {isLoadingInsights && sentimentData.length === 0 && (
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
          Crunching the sentiment and aspect breakdown…
        </div>
      )}

      {insightsError && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {insightsError}
        </div>
      )}

      {/* Sentiment Chart */}
      {sentimentData.length > 0 && (
        <Card className="p-6 bg-muted/40 border border-border">
          <h3 className="text-xl font-semibold mb-4 text-foreground">
            Sentiment Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={110}
                dataKey="value"
              >
                {sentimentData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Aspect Chart */}
      {aspectChartData.length > 0 && (
        <Card className="p-6 bg-muted/40 border border-border">
          <h3 className="text-xl font-semibold mb-4 text-foreground">
            Aspect Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aspectChartData}>
              <XAxis dataKey="aspect" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Positive" fill="#16a34a" />
              <Bar dataKey="Neutral" fill="#ca8a04" />
              <Bar dataKey="Negative" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Top Reviews Section (expandable cards) */}
      {(topPositive.length > 0 || topNegative.length > 0) && (
        <Card className="p-6 bg-muted/40 border border-border">
          <h3 className="text-xl font-semibold mb-6 text-foreground">
            Top Reviews
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Positive Column */}
            <div className="space-y-4">
              <h4 className="text-green-700 font-bold mb-2">Positive Highlights</h4>
              {topPositive.map((r, i) => {
                const isExpanded = expandedPos[i];
                const text = r.text || "";
                const previewLimit = 160;
                const shouldTruncate = text.length > previewLimit;
                const displayText = !shouldTruncate
                  ? text
                  : isExpanded
                    ? text
                    : text.slice(0, previewLimit) + "…";
                return (
                  <div
                    key={`pos-${i}`}
                    className={cn(
                      "group relative rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm transition",
                      "hover:border-green-300"
                    )}
                  >
                    <p className="text-sm leading-relaxed text-foreground/90 italic">
                      “{displayText}”
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-green-700">
                        Confidence: {(r.confidence * 100).toFixed(1)}%
                      </span>
                      {shouldTruncate && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPos((prev) => ({ ...prev, [i]: !isExpanded }))
                          }
                          className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-300"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Negative Column */}
            <div className="space-y-4">
              <h4 className="text-red-700 font-bold mb-2">Negative Highlights</h4>
              {topNegative.map((r, i) => {
                const isExpanded = expandedNeg[i];
                const text = r.text || "";
                const previewLimit = 160;
                const shouldTruncate = text.length > previewLimit;
                const displayText = !shouldTruncate
                  ? text
                  : isExpanded
                    ? text
                    : text.slice(0, previewLimit) + "…";
                return (
                  <div
                    key={`neg-${i}`}
                    className={cn(
                      "group relative rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm transition",
                      "hover:border-red-300"
                    )}
                  >
                    <p className="text-sm leading-relaxed text-foreground/90 italic">
                      “{displayText}”
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-red-700">
                        Confidence: {(r.confidence * 100).toFixed(1)}%
                      </span>
                      {shouldTruncate && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedNeg((prev) => ({ ...prev, [i]: !isExpanded }))
                          }
                          className="text-xs px-2 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Summary */}
      <Card className="p-6 bg-muted/40 border border-border">
        <h3 className="text-xl font-semibold mb-4 text-foreground">
          AI Summary
        </h3>
        <p className="text-foreground/90 text-lg leading-relaxed">
          {summary || "No summary available."}
        </p>
      </Card>

      {/* Aspect-based highlights with dropdown filter */}
      {Object.keys(aspectExamples || {}).length > 0 && (
        <Card className="p-6 bg-muted/40 border border-border">
          <div className="flex items-center justify-between mb-4 gap-4">
            <h3 className="text-xl font-semibold text-foreground">Aspect-based highlights</h3>
            <div className="w-56">
              <Select value={selectedAspect} onValueChange={(v) => setSelectedAspect(v)}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select aspect" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  {Object.keys(aspectExamples)
                    .sort((a, b) => a.localeCompare(b))
                    .map((a) => (
                      <SelectItem key={a} value={a} className="cursor-pointer">
                        {a}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedAspect && (
            <div className="space-y-4">
              {(() => {
                const aspect = selectedAspect;
                const buckets: any = (aspectExamples as any)[aspect] || { Positive: [], Neutral: [], Negative: [] };
                const counts = aspectsRaw[aspect] || { Positive: 0, Neutral: 0, Negative: 0 };
                const sectionKey = (s: string, i: number) => `${aspect}:${s}:${i}`;
                const renderBucket = (label: "Positive" | "Neutral" | "Negative") => (
                  <div className="space-y-2">
                    <h5
                      className={cn(
                        "text-sm font-semibold",
                        label === "Positive" && "text-green-700",
                        label === "Neutral" && "text-yellow-700",
                        label === "Negative" && "text-red-700"
                      )}
                    >
                      {label} ({counts[label] ?? 0})
                    </h5>
                    <div className="space-y-3">
                      {(buckets as any)[label].map((r: any, i: number) => {
                        const key = sectionKey(label, i);
                        const isExp = !!expandedAspect[key];
                        const text: string = r.text || "";
                        const previewLimit = 160;
                        const shouldTruncate = text.length > previewLimit;
                        const displayText = !shouldTruncate ? text : isExp ? text : text.slice(0, previewLimit) + "…";
                        return (
                          <div
                            key={key}
                            className={cn(
                              "rounded-lg border p-3 text-sm",
                              label === "Positive" && "border-green-200 bg-green-50",
                              label === "Neutral" && "border-yellow-200 bg-yellow-50",
                              label === "Negative" && "border-red-200 bg-red-50"
                            )}
                          >
                            <p className="text-foreground/90 italic">“{displayText}”</p>
                            <div className="mt-2 flex items-center justify-between">
                              <span
                                className={cn(
                                  "text-xs font-medium",
                                  label === "Positive" && "text-green-700",
                                  label === "Neutral" && "text-yellow-700",
                                  label === "Negative" && "text-red-700"
                                )}
                              >
                                Confidence: {(r.confidence * 100).toFixed(1)}%
                              </span>
                              {shouldTruncate && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedAspect((p) => ({ ...p, [key]: !isExp }))}
                                  className={cn(
                                    "text-xs px-2 py-1 rounded-md focus:outline-none focus:ring-2",
                                    label === "Positive" && "bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-300",
                                    label === "Neutral" && "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 focus:ring-yellow-300",
                                    label === "Negative" && "bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-300"
                                  )}
                                >
                                  {isExp ? "Show less" : "Show more"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
                return (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="text-lg font-semibold text-foreground">{aspect}</h4>
                      <div className="text-xs text-muted-foreground">
                        <span className="mr-3">P: {counts.Positive ?? 0}</span>
                        <span className="mr-3">N: {counts.Negative ?? 0}</span>
                        <span>U: {counts.Neutral ?? 0}</span>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {renderBucket("Positive")}
                      {renderBucket("Neutral")}
                      {renderBucket("Negative")}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
