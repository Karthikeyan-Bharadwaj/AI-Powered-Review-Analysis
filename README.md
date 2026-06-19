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

- `BESTBUY_API_KEY`
- `MONGO_URI`
- `MONGO_DB`
- `MONGO_COLLECTION`
- `HF_API_TOKEN`
- `GEMINI_API_KEY`
- `SCRAPER_API_KEY`

## Notes

- Do not commit real secrets to the repository.
- `.gitignore` is configured to exclude `.env`, virtual environments, logs, caches, and credential files.
- Push changes via a branch and open a pull request if branch protection is enabled.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
