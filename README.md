# AI Powered Review Analysis

This repository contains a review analysis project with a backend service for scraping and storing review data, and a frontend application for interacting with the analysis tools.

## Project structure

- `backend/` — Python backend services, data, and scripts
- `frontend/` — TypeScript/React frontend application
- `data/` — Example review datasets
- `app.py`, `scraper.py`, `sentiment.py` — top-level helper scripts

## Setup

### Backend

1. Create and activate a Python virtual environment in `backend/`.
2. Install dependencies:
   ```powershell
   cd backend
   python -m pip install -r requirements.txt
   ```
3. Copy the example env file:
   ```powershell
   cd backend
   copy .env.example .env
   ```
4. Fill in your credential values in `backend/.env`.

### Frontend

1. Install dependencies:
   ```powershell
   cd frontend
   npm install
   ```
2. Start the dev server:
   ```powershell
   npm run dev
   ```

## Environment variables

Use `backend/.env.example` as the template. The backend expects values for:

- `MONGO_URI` — MongoDB connection string (e.g. from MongoDB Atlas)
- `SCRAPER_API_KEY` — from ScraperAPI, used as a fallback for both eBay and BestBuy scraping if the direct request is ever blocked
- `FRONTEND_ORIGIN` — the deployed frontend's origin, used to restrict CORS
- `NLP_DISABLE_SUMMARIZER` — set to `true` on memory-constrained hosts to skip loading the local HuggingFace summarization model

Use `frontend/.env.example` as the template for the frontend. It only needs:

- `VITE_API_BASE` — base URL of the deployed backend (no `/api` suffix)

## Notes

- Do not commit real secrets to the repository.
- `.gitignore` is configured to exclude `.env`, virtual environments, logs, caches, and credential files.
- Push changes via a branch and open a pull request if branch protection is enabled.

## Deployment

This app deploys as two services:

- **Backend** (`backend/`) on [Render](https://render.com): Python web service, build command `pip install -r requirements.txt`, start command from the included `Procfile` (`gunicorn app:app`). Set `MONGO_URI`, `SCRAPER_API_KEY`, `FRONTEND_ORIGIN`, and `NLP_DISABLE_SUMMARIZER` as environment variables in the Render dashboard — never commit them.
- **Frontend** (`frontend/`) on [Vercel](https://vercel.com): Vite preset, build command `npm run build`, output directory `dist`. Set `VITE_API_BASE` to the deployed Render backend URL in the Vercel dashboard.

After both are deployed, set `FRONTEND_ORIGIN` on Render to the live Vercel URL and redeploy the backend so CORS allows requests from it.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
