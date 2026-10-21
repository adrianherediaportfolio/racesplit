# RaceSplit — Race Performance Analysis (Mobile App)

Cross-platform mobile app (Android + iOS) for station-by-station performance insights, percentile rankings, and weakness detection for fitness race events.

## Features

- **Athlete Search** — Search by name or bib number, selecting the race event and division
- **Station-by-Station Percentile Breakdown** — See where you rank within your category (age group + gender) for each of the 8 stations
- **Weakness Detector** — Automatically highlights the 2-3 stations where you lose the most time relative to your category median
- **Comparison Charts** — Visual bar charts comparing your splits vs category median vs top 10%
- **Running vs Strength Breakdown** — Aggregate running splits vs station splits to identify cardio vs strength balance
- **User Accounts** — Email + password auth with saved race history
- **Freemium Model** — Free tier (1 analysis) and paid tier (unlimited) with Stripe subscriptions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native (Expo SDK 55), TypeScript |
| Navigation | React Navigation (native stack + bottom tabs) |
| Charts | Custom bar charts, percentile visualizations |
| Storage | AsyncStorage for auth tokens |
| Backend | Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2 |
| Scraper | BeautifulSoup4, httpx, lxml |
| Database | PostgreSQL 16 |
| Auth | JWT (PyJWT), bcrypt |
| Payments | Stripe Checkout and subscription webhooks |
| DevOps | Docker, docker-compose, GitHub Actions CI |

## Project Structure

```
racesplit/
├── mobile/                 # React Native Expo app
│   ├── App.tsx            # Root navigation setup
│   ├── src/
│   │   ├── screens/       # SearchScreen, ResultsScreen, LoginScreen, RegisterScreen, DashboardScreen
│   │   ├── components/    # PercentileBar, WeaknessCard, ComparisonChart, RunVsStationCard
│   │   ├── lib/           # API client, theme constants
│   │   └── navigation/    # TypeScript types for navigation
│   ├── app.json           # Expo configuration
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── api/           # FastAPI route handlers
│   │   ├── scraper/       # BeautifulSoup scraper for race results
│   │   ├── services/      # Analysis engine (percentiles, weakness detection)
│   │   ├── config.py      # Settings (env vars)
│   │   ├── database.py    # SQLAlchemy models
│   │   └── main.py        # FastAPI app entry point
│   └── tests/             # pytest test suite
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Quick Start

### Prerequisites

- Node.js 22+
- Python 3.11+
- PostgreSQL 16 (or use Docker)
- Expo Go app on your phone (for development)

### Backend Setup

```bash
# Start database + backend with Docker
docker-compose up --build

# Or manually:
cd backend
cp .env.example .env
pip install -e ".[dev]"
uvicorn src.main:app --reload --port 8000
```

### Mobile App Setup

```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or Camera app (iOS) to run on your phone.

The Android emulator defaults to `http://10.0.2.2:8000`, and other platforms default to `http://localhost:8000`. A physical phone cannot use the computer's `localhost`; set `EXPO_PUBLIC_API_URL` in `mobile/.env` to the computer's LAN IP, for example `http://192.168.1.25:8000`, and connect both devices to the same network.

### Building for Production

```bash
# Android and iOS
npx eas build --platform all
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

## Stripe Setup

Set these values in `backend/.env`:

```dotenv
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
PUBLIC_BASE_URL=http://localhost:8000
```

Create a recurring price in Stripe and use its ID for `STRIPE_PRICE_ID`. Enable `checkout.session.completed`, `customer.subscription.deleted`, and `customer.subscription.updated` for the webhook endpoint `/api/stripe/webhook`. For local testing, forward Stripe events with:

```bash
stripe listen --forward-to localhost:8000/api/stripe/webhook
```

Copy the signing secret printed by the Stripe CLI to `STRIPE_WEBHOOK_SECRET`. Set `PUBLIC_BASE_URL` to an address reachable by the checkout browser in deployed environments. Stripe webhooks, not the success redirect, update subscription access.

## How It Works

1. **Search**: Enter an athlete's name and select the race event
2. **Scrape**: The backend fetches the athlete's detailed splits from the results page
3. **Category Dataset**: If first time for this category, scrapes all athletes in the same gender + age group
4. **Analysis**: Calculates percentiles, detects weaknesses, generates comparison data
5. **Visualize**: Mobile app renders percentile bars, comparison charts, and weakness cards

### Percentile Calculation

```
percentile = (count_of_slower_athletes_in_category / total_in_category) * 100
```

A percentile of 85 means "faster than 85% of athletes in your category" (top 15%).

## Testing

```bash
# Backend tests
cd backend
pytest -v

# Mobile type check
cd mobile
npx tsc --noEmit
```

## License

Copyright (c) 2026 Adrian Heredia Jimenez. All rights reserved.

This is proprietary software. The code is public so you can see it, but you can't use, copy, modify or distribute it without my written permission. See [LICENSE](LICENSE).

Want to use it or buy a license? Write to adrian.heredia.jimenez@gmail.com.
