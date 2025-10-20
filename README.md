# React DMS

![Backend CI](https://github.com/MaxEmdeWorks/react-dms/actions/workflows/backend.yml/badge.svg)
![Frontend CI](https://github.com/MaxEmdeWorks/react-dms/actions/workflows/frontend.yml/badge.svg)

A minimal full-stack DMS (React & Vite frontend / Flask API backend). Demonstrates CRUD documents, simple search, and status-based archive/restore with a pagination-ready structure. Uses PostgreSQL via SQLAlchemy for persistent storage, enables CORS for local dev, and includes basic GitHub Actions CI.

## Quickstart

### Backend (Flask + Postgres)
Requirements: Python 3.11+, a running Postgres instance.

1. Create venv and install deps
    ```bash
    # Navigate to backend
    cd backend

    # Create venv and activate
    python -m venv .venv
    source .venv/bin/activate  # Windows: .venv\Scripts\activate

    # Install deps
    pip install -r requirements.txt
    ```

2. Set up environment and database
    ```bash
    # Copy example env file
    cp .env .env.local  # Windows: copy .env.example .env

    # Initialize database migrations
    flask db init  # Only needed once
    flask db migrate -m "Initial migration"
    flask db upgrade

    # Start API server
    flask run
    ```

### Frontend (React + Vite)

1. Navigate to frontend, set up env, install deps, and start dev server
    ```bash
    # Navigate to frontend
    cd frontend

    # Copy example env file
    cp .env.example .env  # Windows: copy .env.example .env

    # Install deps and start dev server
    npm i
    npm run dev
    ```

Open the printed URL (usually http://localhost:5173). The app uses `VITE_API_URL` to talk to the Flask backend.

## Features
- Document list with search and status filter
- Create documents (title + comma-separated tags)
- Archive/restore via status toggle
- Delete documents
- Backend with Flask, SQLAlchemy (Postgres), simple CORS
- CI: GitHub Actions for backend and frontend build

## Configuration

Backend: set `DATABASE_URL` in `backend/.env`, e.g.
```
postgresql://username:password@localhost:5432/dbname
```

Frontend: `frontend/.env` (or `.env.local`) sets:
```
VITE_API_URL=http://localhost:5000
```
