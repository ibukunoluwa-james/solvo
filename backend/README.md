# Solvo Backend

This is the FastAPI backend for Solvo, providing APIs for global bulk payroll, tax compliance, and emergency salary advances.

## Tech Stack
- **Framework:** FastAPI
- **Database:** PostgreSQL + Async SQLAlchemy + Alembic
- **Authentication:** JWT + Role-based access control (Employer vs Employee)
- **Integrations:** Kora API (for payouts)

## Setup Instructions

### 1. Environment Setup
Copy the environment template and configure your values. By default, Kora is in mock mode.
```bash
cp .env.example .env
```

### 2. Start PostgreSQL
Use Docker Compose to spin up a local PostgreSQL instance:
```bash
docker-compose up -d
```

### 3. Install Dependencies
It's recommended to use a virtual environment:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Run Migrations
The app will automatically create tables on startup if in development mode (`APP_ENV=development`). However, if you want to use Alembic for generating migrations, you can run:
```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### 5. Run the Server
Start the development server with hot-reload:
```bash
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).
