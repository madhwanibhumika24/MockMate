# MockMate

MockMate is an AI-powered mock interview platform. Users upload a resume and/or
target job description, practice interviews with AI-generated questions, and
receive structured feedback grounded in relevant reference material via
Retrieval-Augmented Generation (RAG).

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Python, FastAPI
- **AI / RAG:** LangChain, a vector store (Chroma by default), an LLM provider
  (e.g. OpenAI)
- **Database:** SQLAlchemy (SQLite for local dev, swappable for Postgres)

## Project Structure

```
MockMate/
├── backend/          FastAPI service, RAG pipeline, business logic
│   ├── app/
│   │   ├── api/      Route definitions
│   │   ├── core/     Config & security
│   │   ├── db/       Database session/engine setup
│   │   ├── models/   Pydantic schemas & ORM models
│   │   ├── rag/       Embeddings, vector store, retriever, chains
│   │   ├── services/ Business logic (interview generation, feedback, parsing)
│   │   └── main.py   App entrypoint
│   ├── data/         Local data (raw uploads, vector store persistence)
│   └── tests/        Backend tests
├── frontend/         React app (Vite)
│   └── src/
│       ├── components/  Reusable UI components
│       ├── pages/        Route-level views
│       ├── hooks/        Custom React hooks
│       ├── services/     API client
│       └── store/        App state
└── docs/             Architecture & design notes
```

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in OPENAI_API_KEY etc.
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Status

Project structure initialized on 2026-09-16. Implementation in progress.
