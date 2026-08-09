# Book Assistant RAG Chatbot

A full-stack RAG (Retrieval-Augmented Generation) application designed to index PDF textbooks/documents and answer questions with source citations, featuring a FastAPI backend, Pinecone vector storage, and a Next.js modern web interface.

---

## 🚀 System Architecture & Flow

### 1. Ingestion Flow
```
PDF Upload (Next.js Frontend)
  └──> FastAPI Backend (`/api/documents/upload`)
        └──> PyPDFLoader & TokenTextSplitter
              └──> OpenAI Embeddings (`text-embedding-3-small`)
                    └──> Pinecone Vector Store (Isolated Namespace per Document)
                          └──> SQLite Database (Document Metadata & Active Status)
```

### 2. Query & Retrieval Flow
```
User Question & Conversation History (Next.js Frontend)
  └──> FastAPI SSE Endpoint (`/api/chat`)
        ├──> Condense Question Chain (incorporates conversation context)
        ├──> Multi-Namespace Similarity Search (queries all active Pinecone namespaces)
        ├──> Deduplication & Source Citation Formatting
        ├──> LCEL Answer Chain (OpenAI `gpt-4o-mini` with teacher-style persona)
        └──> Streaming SSE Tokens & Source Metadata back to Frontend
              └──> Auto-persists Conversation & Messages in SQLite DB
```

---

## ✨ Features

- **Multi-Document Management**: Upload, toggle active state, or delete PDF documents directly from the UI. Retrieval is dynamically scoped to active documents.
- **Real-time SSE Streaming**: Answers stream in real time token-by-token with formatted citations and source excerpts.
- **Conversation Management**: Multi-chat support with automatic title generation, chat persistence, renaming, and deletion.
- **Modern Next.js UI**: Clean interface built with Tailwind CSS, Lucide icons, Markdown rendering, and dynamic dark/light theme support.

---

## 🛠️ Project Structure

```
├── main.py              # FastAPI application & REST/SSE endpoints
├── db.py                # SQLAlchemy Models & SQLite database initialization
├── rag/                 # RAG pipeline modules (retrieval, vectorstore, chains)
│   ├── chains.py        # LangChain LCEL prompt templates & answer chains
│   ├── retriever.py     # PDF loading, splitting, and index construction
│   └── vectorstore.py   # Pinecone index management & embeddings wrapper
├── frontend/            # Next.js 16 frontend application
│   ├── app/             # Next.js App Router pages & layout
│   ├── components/      # React UI components (Sidebar, DocumentDrawer, Chat, etc.)
│   └── lib/             # API client & theme providers
├── ingest.py            # CLI script for manual document ingestion
├── requirements.txt     # Python dependencies
└── app.db               # SQLite database (auto-generated)
```

---

## ⚡ Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ and `npm`
- OpenAI API Key
- Pinecone API Key

---

### Backend Setup

1. **Create and activate a Python virtual environment**:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX_NAME=book-assistant-index
   PINECONE_CLOUD=aws
   PINECONE_REGION=us-east-1
   ALLOWED_ORIGINS=http://localhost:3000
   ```

4. **Start the FastAPI backend server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

---

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables** (optional if default `http://localhost:8000` is used):
   Create `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 CLI Ingestion (Optional)

You can also ingest local PDF documents directly via command line:

```bash
python ingest.py --pdf /path/to/textbook.pdf
```