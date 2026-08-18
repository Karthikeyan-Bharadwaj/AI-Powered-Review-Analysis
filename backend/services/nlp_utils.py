import re
import json
from collections import defaultdict
from pymongo import MongoClient
from nltk.sentiment import SentimentIntensityAnalyzer
import nltk
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from transformers import pipeline

# =====================================================
# 🔧 Setup
# =====================================================
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")


client = MongoClient(MONGO_URI)
raw_db = client["review_system"]
raw_collection = raw_db["reviews_raw"]

processed_db = client["review_system_processed"]
processed_collection = processed_db["reviews"]

# =====================================================
# 🧠 Load Sentiment Model (VADER)
# =====================================================
nltk.download("vader_lexicon", quiet=True)
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)
nltk.download("stopwords", quiet=True)
sia = SentimentIntensityAnalyzer()

try:
    from nltk.corpus import stopwords as _stopwords
    STOPWORDS = set(_stopwords.words("english"))
except Exception:
    STOPWORDS = set()

# =====================================================
# 🧩 Local Summarization Model (DistilBART) — Lazy Load
# =====================================================
summarizer = None  # will be loaded on first use

def get_summarizer():
    """Lazily load summarizer; allow disabling via NLP_DISABLE_SUMMARIZER."""
    global summarizer
    try:
        if os.getenv("NLP_DISABLE_SUMMARIZER", "").lower() in ("1", "true", "yes"):
            return None
        if summarizer is None:
            print("⚙️ Loading local summarization model (DistilBART)...")
            tmp = pipeline(
                "summarization",
                model="sshleifer/distilbart-cnn-12-6",
                device=-1  # change to 0 if you have GPU
            )
            summarizer = tmp
            print("✅ Local summarizer ready!")
        return summarizer
    except Exception as e:
        print("⚠️ Failed to load summarizer:", e)
        summarizer = None
        return None

# =====================================================
# ✂️ Lightweight extractive summary (no heavy model, no OOM risk)
# =====================================================
def extractive_summary(text: str, max_sentences: int = 5, min_words: int = 5) -> str:
    """Pick the most representative sentences by word-frequency scoring
    (classic Luhn-style extractive summarization). Cheap, fast, and stable
    on low-memory hosts — used whenever the heavy AI summarizer is disabled."""
    if not text.strip():
        return "No reviews available to summarize."

    try:
        sentences = nltk.sent_tokenize(text)
    except Exception:
        sentences = re.split(r"(?<=[.!?])\s+", text)

    sentences = [s.strip() for s in sentences if len(s.split()) >= min_words]
    if not sentences:
        return text[:500].strip()

    word_freq: dict = {}
    for sentence in sentences:
        for word in re.findall(r"[a-zA-Z']+", sentence.lower()):
            if word in STOPWORDS:
                continue
            word_freq[word] = word_freq.get(word, 0) + 1

    if not word_freq:
        return " ".join(sentences[:max_sentences])

    max_freq = max(word_freq.values())
    for word in word_freq:
        word_freq[word] /= max_freq

    seen = set()
    scored = []
    for idx, sentence in enumerate(sentences):
        normalized = sentence.lower().strip()
        if normalized in seen:
            continue
        seen.add(normalized)
        words = re.findall(r"[a-zA-Z']+", sentence.lower())
        score = sum(word_freq.get(w, 0) for w in words) / (len(words) or 1)
        scored.append((idx, score, sentence))

    top = sorted(scored, key=lambda x: x[1], reverse=True)[:max_sentences]
    # Restore original review order so the summary reads naturally
    top_in_order = [s for _, _, s in sorted(top, key=lambda x: x[0])]
    return " ".join(top_in_order)


# =====================================================
# 🔍 Aspect Keywords
# =====================================================
ASPECT_KEYWORDS = {
    "Price": ["price", "cost", "expensive", "cheap", "value", "worth", "money", "deal", "overpriced"],
    "Quality": ["quality", "durable", "broken", "excellent", "bad", "defective", "sturdy", "cheaply", "well made", "poorly made"],
    "Delivery": ["delivery", "shipping", "shipped", "late", "fast", "slow", "arrived", "shipment", "tracking"],
    "Packaging": ["packaging", "box", "seal", "damaged", "package", "wrapped", "boxed"],
    "Usability": ["use", "performance", "speed", "battery", "easy to use", "difficult", "setup", "instructions", "comfortable"],
    "Customer Service": ["refund", "return", "replace", "replacement", "customer service", "support", "seller", "vendor", "response", "communication", "complaint"],
    "Authenticity": ["authentic", "fake", "counterfeit", "genuine", "as described", "not as described", "advertised", "wrong item", "misleading"],
}

# =====================================================
# 🧠 Sentiment & Aspect Processing
# =====================================================
def analyze_sentiment(text):
    score = sia.polarity_scores(text)["compound"]
    if score >= 0.05:
        sentiment = "Positive"
    elif score <= -0.05:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"
    return sentiment, abs(score)


def analyze_aspects(text):
    text = text.lower()
    found_aspects = []
    for aspect, keywords in ASPECT_KEYWORDS.items():
        if any(re.search(rf"\b{re.escape(k)}\b", text) for k in keywords):
            found_aspects.append(aspect)
    # Every review should count toward at least one bucket, otherwise reviews
    # that don't hit a specific keyword (but still carry real sentiment) silently
    # vanish from the aspect breakdown and skew it toward whichever aspects
    # happen to be keyword-matched.
    if not found_aspects:
        found_aspects.append("General")
    return found_aspects


# =====================================================
# 🧩 Process Reviews and Save to Mongo
# =====================================================
def process_reviews(product_id: str = None, force: bool = False):
    query = {"product_id": product_id} if product_id else {}

    if not force and product_id:
        existing = processed_collection.count_documents({"product_id": product_id})
        if existing > 0:
            print(f"💾 Found {existing} processed reviews for {product_id}. Skipping NLP re-run.")
            return list(processed_collection.find(query))

    raw_reviews = list(raw_collection.find(query))
    if not raw_reviews:
        print(f"⚠️ No raw reviews found for {product_id}. Run scraper first.")
        return []

    print(f"🔹 Found {len(raw_reviews)} raw reviews for {product_id}")
    print(f"🧠 Starting NLP for product_id={product_id}")

    inserted = 0
    for r in raw_reviews:
        text = r.get("text", "").strip()
        if not text:
            continue

        sentiment, confidence = analyze_sentiment(text)
        aspects = analyze_aspects(text)

        processed_review = {
            "product_id": r.get("product_id"),
            "source": r.get("source", "ebay"),
            "reviewer": r.get("reviewer", "Anonymous"),
            "rating": r.get("rating"),
            "text": text,
            "date": r.get("date", ""),
            "sentiment": sentiment,
            "confidence": confidence,
            "aspects": aspects,
        }

        if not processed_collection.find_one(
            {"product_id": processed_review["product_id"], "text": processed_review["text"]}
        ):
            processed_collection.insert_one(processed_review)
            inserted += 1

    print(f"✅ Inserted {inserted} new processed reviews for {product_id}")
    return list(processed_collection.find(query))

# =====================================================
# 📊 Sentiment + Aspect Summary
# =====================================================
def _compute_sentiment_summary(docs):
    total = len(docs)
    pos = sum(1 for d in docs if d.get("sentiment") == "Positive")
    neg = sum(1 for d in docs if d.get("sentiment") == "Negative")
    neu = sum(1 for d in docs if d.get("sentiment") == "Neutral")
    pct = lambda x: round(100 * x / total, 2) if total else 0
    overall_score = round(pct(pos) - pct(neg), 2)
    return {
        "total_reviews": total,
        "positive_%": pct(pos),
        "negative_%": pct(neg),
        "neutral_%": pct(neu),
        "overall_score": overall_score,
    }


def _compute_aspect_summary(docs):
    agg = defaultdict(lambda: {"Positive": 0, "Negative": 0, "Neutral": 0, "Total": 0})
    for d in docs:
        aspects = d.get("aspects") or []
        sent = d.get("sentiment")
        if not aspects or sent not in ("Positive", "Negative", "Neutral"):
            continue
        for a in aspects:
            agg[a][sent] += 1
            agg[a]["Total"] += 1
    return dict(agg)

# =====================================================
# ⚔️ Compare Two Products (Sentiment & Aspect)
# =====================================================
def compare_products(product_ids):
    results = []
    for pid in product_ids:
        docs = list(processed_collection.find({"product_id": pid}))
        sentiment = _compute_sentiment_summary(docs)
        aspects = _compute_aspect_summary(docs)
        results.append({"product_id": pid, "sentiment": sentiment, "aspects": aspects})

    all_aspects = set()
    for p in results:
        all_aspects.update(p["aspects"].keys())

    aspect_table = {}
    for aspect in sorted(all_aspects):
        aspect_table[aspect] = {}
        for p in results:
            pid = p["product_id"]
            counts = p["aspects"].get(aspect, {"Positive": 0, "Negative": 0, "Neutral": 0, "Total": 0})
            aspect_table[aspect][pid] = counts

    summary_rows = []
    for p in results:
        summary_rows.append({"product_id": p["product_id"], **p["sentiment"]})

    return {"summary": summary_rows, "aspect_table": aspect_table, "product_ids": product_ids}

# =====================================================
# 🧠 Local Summary for Single Product
# =====================================================
def generate_ai_summary_api(product_id: str, max_reviews: int = 150):
    """Generate AI summary using local DistilBART model."""
    try:
        reviews = list(processed_collection.find({"product_id": product_id}).limit(max_reviews))
        if not reviews:
            return "No processed reviews found for summarization."

        sum_model = get_summarizer()
        all_text = " ".join(r.get("text", "") for r in reviews if r.get("text"))
        # Hard cap to prevent OOM
        max_chars = int(os.getenv("SUMMARY_MAX_CHARS", "120000"))
        if len(all_text) > max_chars:
            all_text = all_text[:max_chars]
        print(f"🧾 Total text length used: {len(all_text)} characters")

        if sum_model is None:
            final_summary = extractive_summary(all_text, max_sentences=6)
        else:
            # Split text into chunks
            chunk_size = int(os.getenv("SUMMARY_CHUNK_SIZE", "2500"))
            chunks = [all_text[i:i + chunk_size] for i in range(0, len(all_text), chunk_size)]

            summaries = []
            for i, chunk in enumerate(chunks, 1):
                print(f"✍️ Summarizing chunk {i}/{len(chunks)}...")
                partial = sum_model(chunk, max_length=150, min_length=60, do_sample=False)[0]["summary_text"]
                summaries.append(partial)
            final_summary = " ".join(summaries)

        # Save to Mongo
        summary_col = processed_db["review_summaries"]
        doc = {
            "product_id": product_id,
            "summary": final_summary,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        summary_col.update_one({"product_id": product_id}, {"$set": doc}, upsert=True)

        print("✅ Summary saved successfully.")
        return final_summary

    except Exception as e:
        print("⚠️ Local summarizer error:", e)
        return f"Summarization failed: {e}"

# =====================================================
# ⚔️ Local Competitor Summary (New)
# =====================================================
def generate_competitor_summary_api(pid1: str, pid2: str, title1: str, title2: str, max_reviews: int = 100):
    """Compare two products using summarization and aspect sentiment scores."""
    from collections import defaultdict

    try:
        reviews1 = list(processed_collection.find({"product_id": pid1}).limit(max_reviews))
        reviews2 = list(processed_collection.find({"product_id": pid2}).limit(max_reviews))

        if not reviews1 or not reviews2:
            return {"error": "Not enough processed reviews for both products."}

        # ✅ Summarization Part (keep as before)
        text1 = " ".join(r.get("text", "") for r in reviews1)
        text2 = " ".join(r.get("text", "") for r in reviews2)

        print(f"🧠 Generating competitor summaries for {title1} vs {title2}")
        sum_model = get_summarizer()
        if sum_model is None:
            summary1 = extractive_summary(text1, max_sentences=4) or "No summary available."
            summary2 = extractive_summary(text2, max_sentences=4) or "No summary available."
        else:
            summary1 = sum_model(text1[:2500], max_length=130, min_length=60, do_sample=False)[0]["summary_text"]
            summary2 = sum_model(text2[:2500], max_length=130, min_length=60, do_sample=False)[0]["summary_text"]

        # ✅ Aspect Scoring Part
        def get_aspect_scores(docs):
            aspect_map = defaultdict(lambda: {"Positive": 0, "Neutral": 0, "Negative": 0})
            for d in docs:
                for aspect in d.get("aspects", []):
                    s = d.get("sentiment", "Neutral")
                    aspect_map[aspect][s] += 1

            scores = {}
            for aspect, vals in aspect_map.items():
                total = vals["Positive"] + vals["Neutral"] + vals["Negative"]
                if total == 0:
                    continue
                score = (vals["Positive"] - vals["Negative"]) / total
                scores[aspect] = round(score, 3)
            return scores

        scores1 = get_aspect_scores(reviews1)
        scores2 = get_aspect_scores(reviews2)

        # ✅ Determine winners per aspect
        comparison = []
        for aspect in set(scores1.keys()) | set(scores2.keys()):
            a1 = scores1.get(aspect, 0)
            a2 = scores2.get(aspect, 0)
            if abs(a1 - a2) < 0.05:
                winner = "Tie"
            elif a1 > a2:
                winner = title1
            else:
                winner = title2
            comparison.append({
                "aspect": aspect,
                title1: a1,
                title2: a2,
                "winner": winner
            })

        # ✅ Compute overall scores
        overall1 = round(sum(scores1.values()) / len(scores1), 3) if scores1 else 0
        overall2 = round(sum(scores2.values()) / len(scores2), 3) if scores2 else 0
        if abs(overall1 - overall2) < 0.05:
            overall_winner = "Tie"
        elif overall1 > overall2:
            overall_winner = title1
        else:
            overall_winner = title2

        # ✅ Build Final Combined Output
        combined_summary = {
            "summary": (
                f"📦 {title1} Summary:\n{summary1}\n\n"
                f"🛒 {title2} Summary:\n{summary2}\n\n"
                f"🏁 Overall Comparison:\nBoth products have unique strengths. "
                f"{title1} may appeal more to users valuing {', '.join([a['aspect'] for a in comparison if a['winner']==title1][:2])}, "
                f"while {title2} performs better for {', '.join([a['aspect'] for a in comparison if a['winner']==title2][:2])}."
            ),
            "comparison": comparison,
            "overall": {
                title1: overall1,
                title2: overall2,
                "winner": overall_winner
            }
        }

        return combined_summary

    except Exception as e:
        print("⚠️ Local competitor summary error:", e)
        return {"error": str(e)}

