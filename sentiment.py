# sentiment.py
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
nltk.download("vader_lexicon", quiet=True)

def analyze_sentiment(reviews):
    sia = SentimentIntensityAnalyzer()
    analyzed = []
    for r in reviews:
        text = r.get("text", "")
        if not text.strip():
            continue
        score = sia.polarity_scores(text)["compound"]
        if score >= 0.05:
            sentiment = "Positive"
        elif score <= -0.05:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"
        analyzed.append({
            **r,
            "sentiment": sentiment,
            "score": round(score, 3)
        })
    return analyzed
