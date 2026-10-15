# Agrimind - Local Production-Ready Agriculture AI Platform

Agrimind is an intelligent agricultural decision-support and disease diagnostic platform. It combines modern web engineering, real-time meteorological data, predictive soil-crop machine learning, and deep learning vision models to empower farmers and agronomists.

---

## 🏛️ System Architecture & Tech Stack

```
Next.js 14 Frontend (App Router, Tailwind CSS, TypeScript)
       │
       │ HTTP / REST with Bearer JWT
       ▼
FastAPI Backend (Python 3.11+, Pydantic v2, Security & Auth)
       │
       │ SQLAlchemy 2.0 ORM + Alembic Migrations
       ▼
Local PostgreSQL 16 (Docker or Local Native Installation)
```

- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Uvicorn.
- **Authentication**: Custom stateless JWT authentication (`HS256`, PyJWT) with `bcrypt` password hashing and secure token management.
- **Database**: Local PostgreSQL 16 (containerized via Docker Compose or native local instance) managed via SQLAlchemy 2.0 ORM and Alembic migrations.
- **AI & Machine Learning**: Python ML (scikit-learn, XGBoost) & Hugging Face Vision Transformers / timm.
- **Weather Services**: Open-Meteo API routed through FastAPI backend with automatic farm coordinate resolution, LRU caching, and historical `weather_data` snapshot logging.
- **File Storage**: Local filesystem storage located in `backend/uploads/` served securely via FastAPI static file mounting.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.11 or 3.12 installed
- **Node.js**: 18+ or 20+ installed
- **Docker & Docker Compose**: (Optional, for running PostgreSQL and Adminer in containers)

---

### Step 1: Start PostgreSQL

#### Option A: Using Docker Compose (Recommended)
From the repository root:
```bash
docker compose up -d postgres
```
This launches:
- **PostgreSQL 16**: `localhost:5432` (database: `agrimind`, user: `agrimind`, password: `agrimind_password`)
- Optionally start Adminer (Web GUI for database):
  ```bash
  docker compose up -d adminer
  ```
  Access Adminer at [http://localhost:8080](http://localhost:8080) (System: PostgreSQL, Server: postgres, Username: agrimind, Password: agrimind_password, Database: agrimind).

#### Option B: Using a Locally Installed PostgreSQL
Create a database and user:
```sql
CREATE USER agrimind WITH PASSWORD 'agrimind_password';
CREATE DATABASE agrimind OWNER agrimind;
```

---

### Step 2: Configure & Start the Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *(Or on Windows PowerShell: `Copy-Item .env.example .env`)*

   Default configuration in `.env`:
   ```env
   PROJECT_NAME="Agrimind API"
   DATABASE_URL=postgresql+psycopg://agrimind:agrimind_password@localhost:5432/agrimind
   JWT_SECRET_KEY=generate_a_secure_random_secret_key_for_production_use
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
   UPLOAD_DIR=uploads
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run database migrations with Alembic:
   ```bash
   alembic upgrade head
   ```
   *(This creates all 10 core relational tables and seeds the standard crop agronomy catalog)*

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   The backend API and interactive documentation will be available at:
   - Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   - ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
   - Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Step 3: Configure & Start the Frontend

1. In a new terminal, navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```
   *(Or on Windows PowerShell: `Copy-Item .env.local.example .env.local`)*

   Default configuration in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_APP_NAME=Agrimind
   ```

3. Install frontend dependencies:
   ```bash
   npm install
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Access the Agrimind web interface at [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Database Schema & Alembic Migrations

The local PostgreSQL database manages 10 core tables:

1. **`users`**: User identity, unique email, bcrypt password hash, and active/admin status.
2. **`farmer_profiles`**: Farmer demographics (full name, phone, state, district, experience, preferred language).
3. **`farms`**: Farm specifications (name, latitude, longitude, land area in acres, soil type, irrigation type). Includes ownership checks preventing unauthorized access.
4. **`soil_data`**: Soil test records (Nitrogen N, Phosphorus P, Potassium K, pH, electrical conductivity, moisture).
5. **`crops`**: Agronomy catalog of standard crops with optimal NPK, pH, and climate parameters.
6. **`crop_cycles`**: Active and historical planting seasons, stages (sown, vegetative, flowering, maturity, harvested), and yield tracking.
7. **`crop_recommendations`**: Stored machine learning crop recommendations generated for a farm.
8. **`fertilizer_recommendations`**: Calculated fertilizer dosages (Urea, DAP, MOP) based on soil deficit analysis.
9. **`crop_health_reports`**: Disease detection diagnostic records, infected leaf image paths in `uploads/`, confidence scores, and treatment plans.
10. **`weather_data`**: Meteorological snapshots captured from Open-Meteo per farm location.
11. **`ai_conversations` & `ai_messages`**: Chat history and assistant context for agricultural advisory queries.

### Migration Commands
- Apply latest migrations:
  ```bash
  alembic upgrade head
  ```
- Rollback one migration:
  ```bash
  alembic downgrade -1
  ```
- Generate a new migration after model edits:
  ```bash
  alembic revision --autogenerate -m "describe_change"
  ```

---

## 🧪 Testing

The backend includes a comprehensive automated test suite verifying all models, authentication, authorization/IDOR safety, weather endpoints, and recommendation pipelines:

```bash
cd backend
python -m unittest discover -s tests -p "test_*.py" -v
```

All 39 unit and integration tests run independently against isolated in-memory test databases.

---

## 📁 Repository Structure

```text
Agrimind/
├── docker-compose.yml       # Local PostgreSQL 16 & Adminer orchestration
├── backend/                 # FastAPI REST backend service
│   ├── alembic/             # Database migration versions and environment
│   ├── app/
│   │   ├── api/             # REST route handlers (auth, farms, weather, crops, health, assistant)
│   │   ├── core/            # Config, security (bcrypt, JWT), and exceptions
│   │   ├── db/              # SQLAlchemy engine, base model, and declarative models
│   │   ├── schemas/         # Pydantic request and response schemas
│   │   └── services/        # Business logic, ML engine, and Open-Meteo weather client
│   ├── scripts/             # Data migration utilities (import_supabase_data.py)
│   ├── tests/               # Automated test suites
│   ├── uploads/             # Local storage directory for uploaded plant leaf images
│   ├── requirements.txt     # Python package dependencies
│   └── alembic.ini          # Alembic configuration
├── frontend/                # Next.js frontend application (App Router)
│   ├── app/                 # Next.js pages: (auth), (dashboard), landing, diagnostics
│   ├── components/          # Reusable UI components & layouts
│   ├── lib/
│   │   ├── api.ts           # Centralized typed HTTP client with JWT interceptor
│   │   └── auth-context.tsx # React authentication state context provider
│   └── package.json         # Node.js dependencies
└── README.md                # Project documentation and setup guide
```
