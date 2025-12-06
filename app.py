# app.py
import streamlit as st
import json, os
from scraper import extract_product_id, get_flipkart_reviews, save_reviews
from sentiment import analyze_sentiment
import matplotlib.pyplot as plt
import pandas as pd

st.set_page_config(page_title="Flipkart Review Analyzer", layout="wide")

st.title("🛍️ Flipkart Product Review Sentiment Dashboard")
st.markdown("Analyze real Flipkart reviews instantly — no API keys required!")

# --- Sidebar ---
st.sidebar.header("🔍 Search Product")
user_input = st.sidebar.text_input("Enter Flipkart Product ID or URL:")
max_pages = st.sidebar.slider("Number of pages to scrape", 1, 10, 3)

# --- Trigger ---
if st.sidebar.button("Fetch & Analyze Reviews"):
    if not user_input.strip():
        st.warning("Please enter a product link or ID.")
    else:
        st.write("⚙️ Starting analysis...")
        with st.spinner("Fetching reviews..."):
            pid = extract_product_id(user_input)
            reviews = get_flipkart_reviews(pid, max_pages)
            path = save_reviews(pid, reviews)
        with st.spinner("Analyzing sentiment..."):
            analyzed = analyze_sentiment(reviews)
        if not analyzed:
            st.error("No reviews found.")
        else:
            st.success(f"✅ Analyzed {len(analyzed)} reviews.")

            df = pd.DataFrame(analyzed)
            st.subheader("📊 Sentiment Distribution")
            counts = df["sentiment"].value_counts()
            fig, ax = plt.subplots()
            ax.pie(counts, labels=counts.index, autopct="%1.1f%%", startangle=140)
            st.pyplot(fig)

            st.subheader("🌟 Top Positive Reviews")
            for r in df[df["sentiment"] == "Positive"].head(3)["text"]:
                st.success(r)
            st.subheader("💢 Top Negative Reviews")
            for r in df[df["sentiment"] == "Negative"].head(3)["text"]:
                st.error(r)

            csv = df.to_csv(index=False).encode("utf-8")
            st.download_button("⬇️ Download CSV", csv, f"flipkart_reviews_{pid}.csv", "text/csv")
else:
    st.info("👈 Enter a Flipkart product link or ID in the sidebar, then click *Fetch & Analyze Reviews*.")
