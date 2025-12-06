# scraper.py
import os

# Create the 'data' folder automatically if it doesn't exist
os.makedirs("data", exist_ok=True)
import requests
from bs4 import BeautifulSoup
import json
import re

def extract_product_id(url_or_id: str):
    # Extract pid from link or use as-is
    match = re.search(r"pid=([A-Z0-9]+)", url_or_id)
    if match:
        return match.group(1)
    return url_or_id.strip()

def get_flipkart_reviews(pid: str, max_pages=3):
    import requests
    from bs4 import BeautifulSoup

    all_reviews = []
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/118.0 Safari/537.36"
        )
    }

    for page in range(1, max_pages + 1):
        url = f"https://www.flipkart.com/product-reviews/{pid}?pid={pid}&page={page}"
        print(f"🔎 Fetching page {page}: {url}")
        resp = requests.get(url, headers=headers)
        if resp.status_code != 200:
            print(f"⚠️ Page {page} fetch failed with {resp.status_code}")
            break

        soup = BeautifulSoup(resp.text, "html.parser")

        # New Flipkart review container classes (2025 layout)
        review_blocks = soup.find_all("div", class_=["RcXBOT", "col", "t-ZTKy", "_27M-vq"])
        if not review_blocks:
            print(f"⚠️ No review blocks found on page {page}")
            continue

        for block in review_blocks:
            # Extract review text
            text_tag = block.find("div", class_="ZmyHeo") or block.find("div", class_="t-ZTKy")
            text = text_tag.get_text(strip=True) if text_tag else ""

            # Extract rating
            rating_tag = block.find("div", class_="_3LWZlK _1BLPMq") or block.find("div", class_="_3LWZlK")
            rating = rating_tag.text.strip() if rating_tag else None

            if text:
                all_reviews.append({"rating": rating, "text": text})

        # Stop if no reviews found on a page
        if not review_blocks:
            break

    print(f"✅ Fetched {len(all_reviews)} reviews total")
    return all_reviews


def save_reviews(pid, reviews):
    path = f"data/flipkart_reviews_{pid}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(reviews, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved {len(reviews)} reviews to {path}")
    return path
