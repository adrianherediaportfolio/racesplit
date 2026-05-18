# RaceSplit — Race Performance Analysis

Station-by-station performance insights, percentile rankings, and weakness detection for fitness race events.

## Features

- **Athlete Search** — Search by name or bib number, selecting the race event and division
- **Station-by-Station Percentile Breakdown** — See where you rank within your category (age group + gender) for each of the 8 stations
- **Weakness Detector** — Automatically highlights the 2-3 stations where you lose the most time relative to your category median
- **Comparison Charts** — Visual bar charts comparing your splits vs category median vs top 10%
- **Running vs Strength Breakdown** — Aggregate running splits vs station splits to identify cardio vs strength balance
- **User Accounts** — Email + password auth with saved race history
- **Freemium Model** — Free tier (1 analysis) + paid tier (unlimited, Stripe integration scaffold)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS v4, Recharts |
| Backend | Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2 |
| Scraper | BeautifulSoup4, httpx, lxml |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose), bcrypt |
| Payments | Stripe (scaffold) |
| DevOps | Docker, docker-compose, GitHub Actions CI |

## Project Structure

```
racesplit/
├── backend/
│   ├── src/
│   │   ├── api/           # FastAPI route handlers
│   │   ├── scraper/       # BeautifulSoup scraper for race results
│   │   ├── services/      # Analysis engine (percentiles, weakness detection)
│   │   ├── config.py      # Settings (env vars)
│   │   ├── database.py    # SQLAlchemy models
│   │   ├── models.py      # Pydantic schemas
│   │   └── main.py        # FastAPI app entry point
│   └── tests/             # pytest test suite
├── frontend/
│   └── src/
│       ├── app/           # Next.js app router pages
│       ├── components/    # React components (charts, percentile bars)
│       └── lib/           # API client
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 22+
- PostgreSQL 16 (or use Docker)

### Using Docker (recommended)

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### Manual Setup

**Backend:**

```bash
cd backend
cp .env.example .env
pip install -e ".[dev]"
uvicorn src.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/races` | List available race events |
| GET | `/api/races/{name}/divisions` | List divisions for a race |
| POST | `/api/search` | Search athletes by name |
| POST | `/api/analyze` | Full analysis (percentiles, weaknesses, comparisons) |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user info |
| POST | `/api/saved-races` | Save a race analysis |
| GET | `/api/saved-races` | List saved analyses |
| DELETE | `/api/saved-races/{id}` | Remove saved analysis |
| POST | `/api/stripe/checkout` | Create Stripe checkout session |
| POST | `/api/stripe/webhook` | Stripe webhook handler |

## How It Works

1. **Search**: Enter an athlete's name and select the race event
2. **Scrape**: The backend fetches the athlete's detailed splits from the results page
3. **Category Dataset**: If first time for this category, scrapes all athletes in the same gender + age group
4. **Analysis**: Calculates percentiles, detects weaknesses, generates comparison data
5. **Visualize**: Frontend renders percentile bars, comparison charts, and weakness cards

### Percentile Calculation

```
percentile = (count_of_slower_athletes_in_category / total_in_category) × 100
```

A percentile of 85 means "faster than 85% of athletes in your category" (top 15%).

### Weakness Detection

Ranks stations by gap between athlete time and category median. Top 3 stations with the largest positive gap (slower than median) are flagged as weaknesses.

## Testing

```bash
cd backend
pytest -v
```

20 tests covering:
- Time parsing and conversion (12 tests)
- Percentile calculation logic (8 tests)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://racesplit:racesplit@localhost:5432/racesplit` | PostgreSQL connection |
| `SECRET_KEY` | dev default | JWT signing key |
| `STRIPE_SECRET_KEY` | empty | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | empty | Stripe webhook secret |
| `STRIPE_PRICE_ID` | empty | Stripe price ID for paid tier |

## License

MIT
