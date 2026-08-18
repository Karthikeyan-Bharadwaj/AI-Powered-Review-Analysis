import os
import re
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs
from pymongo import MongoClient, errors
from dotenv import load_dotenv

# -----------------------------------
# 1️⃣ Setup
# -----------------------------------
load_dotenv()

SCRAPER_API_KEY = os.getenv("SCRAPER_API_KEY")
SCRAPER_BASE = "https://api.scraperapi.com"
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# ✅ Unified DB + Collection (Same as eBay + NLP Utils)
MONGO_DB = "review_system"
MONGO_COLLECTION = "reviews_raw"

DIRECT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

# -----------------------------------
# 2️⃣ MongoDB Helper
# -----------------------------------
def get_mongo_collection():
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    col = db[MONGO_COLLECTION]

    # ✅ Safe index for faster lookups
    col.create_index([("product_id", 1)], name="product_id_index")
    return col

# -----------------------------------
# 3️⃣ SKU Extractor
# -----------------------------------
def extract_sku(url_or_sku: str) -> str:
    """Attempt to extract a BestBuy SKU from:
    - Direct numeric input (6–8 digits)
    - URL query parameter skuId=1234567
    - URL path segment ending with /1234567.p or /sku/1234567
    Raises ValueError if no SKU can be found.
    """
    raw = (url_or_sku or "").strip()
    if not raw:
        raise ValueError("❌ Empty input. Provide a BestBuy product URL or SKU number.")

    # Direct numeric SKU
    if re.fullmatch(r"\d{6,8}", raw):
        return raw

    # Parse URL components
    try:
        parsed = urlparse(raw)
        # Query param skuId
        qs = parse_qs(parsed.query)
        if "skuId" in qs and qs["skuId"]:
            candidate = qs["skuId"][0]
            if re.fullmatch(r"\d{6,8}", candidate):
                return candidate
        # Path pattern /1234567.p
        path_match = re.search(r"/(\d{6,8})\.p", parsed.path)
        if path_match:
            return path_match.group(1)
        # Path pattern /sku/1234567
        sku_match = re.search(r"/sku/(\d{6,8})", parsed.path)
        if sku_match:
            return sku_match.group(1)
    except Exception:
        # If urlparse fails, continue to regex attempts below
        pass

    # Any bare 6-8 digit run anywhere in the string (last resort)
    fallback_match = re.search(r"\b(\d{6,8})\b", raw)
    if fallback_match:
        return fallback_match.group(1)

    raise ValueError("❌ Could not extract SKU. Provide a BestBuy URL containing a SKU number or a raw numeric SKU.")

# -----------------------------------
# 4️⃣ Direct scrape (with ScraperAPI fallback)
# -----------------------------------
def _fetch_html(url: str, render: bool = False) -> str | None:
    """Scrape BestBuy directly first (no third-party API or credits used);
    fall back to ScraperAPI only if BestBuy blocks/rejects the direct request."""
    if not render:
        try:
            resp = requests.get(url, headers=DIRECT_HEADERS, timeout=20)
            if resp.status_code == 200 and len(resp.text) > 1000:
                return resp.text
            print(f"⚠️ Direct request got HTTP {resp.status_code}, falling back to ScraperAPI")
        except requests.RequestException as e:
            print(f"⚠️ Direct request failed ({e}), falling back to ScraperAPI")

    if not SCRAPER_API_KEY:
        return None

    params = {"api_key": SCRAPER_API_KEY, "url": url}
    if render:
        params["render"] = "true"
    for i in range(3):
        try:
            resp = requests.get(SCRAPER_BASE, params=params, timeout=60)
            if resp.status_code == 200:
                return resp.text
            print(f"⚠️ ScraperAPI HTTP {resp.status_code}, retry {i + 1}")
        except requests.RequestException as e:
            print(f"⚠️ ScraperAPI error ({e}), retry {i + 1}")
        time.sleep(2)
    return None


def _parse_reviews(html: str, sku: str) -> list:
    soup = BeautifulSoup(html, "html.parser")
    items = soup.select(".review-item")
    reviews = []
    for item in items:
        body = item.select_one(".ugc-review-body")
        text = body.get_text(" ", strip=True) if body else ""
        if not text:
            continue

        author_elem = item.select_one(".ugc-author")
        rating_elem = item.select_one(".review-rating .visually-hidden")
        title_elem = item.select_one(".review-title")
        date_elem = item.select_one(".submission-date")

        rating = None
        if rating_elem:
            rating_match = re.search(r"Rated (\d+(?:\.\d+)?) out of", rating_elem.get_text(strip=True))
            if rating_match:
                rating = float(rating_match.group(1))

        reviews.append({
            "sku": sku,
            "product_id": sku,
            "source": "bestbuy",
            "reviewer": author_elem.get_text(strip=True) if author_elem else "Anonymous",
            "rating": rating,
            "title": title_elem.get_text(strip=True) if title_elem else "",
            "text": text,
            "date": (date_elem.get("title") if date_elem else "") or "",
        })
    return reviews


def fetch_bestbuy_reviews(sku: str, max_pages: int = 5) -> list:
    """Scrape BestBuy customer reviews for a SKU directly from bestbuy.com."""
    all_reviews = []
    for page in range(1, max_pages + 1):
        url = f"https://www.bestbuy.com/site/reviews/x/{sku}?page={page}&pageSize=20"
        html = _fetch_html(url)
        if not html:
            print(f"⚠️ Could not fetch page {page} for SKU {sku}")
            break

        page_reviews = _parse_reviews(html, sku)
        print(f"👉 Found {len(page_reviews)} reviews on page {page}")
        if not page_reviews:
            break

        all_reviews.extend(page_reviews)
        if len(page_reviews) < 20:
            # Last page (fewer than a full page of results)
            break
        time.sleep(1)

    # Deduplicate by review text
    unique = []
    seen = set()
    for r in all_reviews:
        if r["text"] not in seen:
            unique.append(r)
            seen.add(r["text"])

    print(f"✅ Total unique reviews: {len(unique)}")
    return unique

# -----------------------------------
# 5️⃣ Save to MongoDB
# -----------------------------------
def save_reviews_to_mongo(reviews: list):
    col = get_mongo_collection()
    inserted = 0
    for r in reviews:
        try:
            if not col.find_one({"product_id": r["product_id"], "text": r["text"]}):
                col.insert_one(r)
                inserted += 1
        except errors.DuplicateKeyError:
            continue
    return inserted

# -----------------------------------
# 6️⃣ Scraper with Caching
# -----------------------------------
def scrape_and_store_reviews(link_or_sku: str) -> list:
    col = get_mongo_collection()
    sku = extract_sku(link_or_sku)

    # ✅ Step 1: Check Mongo cache
    existing = list(col.find({"sku": sku}))
    if existing:
        print(f"💾 Found {len(existing)} cached reviews for SKU {sku}. Skipping scrape.")
        normalized_existing = [
            {
                "sku": sku,
                "product_id": doc.get("product_id") or sku,
                "source": doc.get("source", "bestbuy"),
                "reviewer": doc.get("reviewer") or "Anonymous",
                "rating": doc.get("rating"),
                "title": doc.get("title"),
                "text": doc.get("text") or "",
                "date": doc.get("date", ""),
            }
            for doc in existing
        ]
        return normalized_existing

    print(f"🆔 Extracted SKU: {sku}")
    print("🔍 No cache found — scraping reviews directly from bestbuy.com...\n")

    reviews = fetch_bestbuy_reviews(sku)
    if not reviews:
        print("❌ No reviews found.")
        return []

    inserted = save_reviews_to_mongo(reviews)
    print(f"\n✅ Done. Inserted {inserted} new reviews for SKU {sku}.")
    return reviews

# -----------------------------------
# 7️⃣ CLI Entry
# -----------------------------------
if __name__ == "__main__":
    user_input = input("🔗 Enter BestBuy product URL or SKU: ").strip()
    scrape_and_store_reviews(user_input)
