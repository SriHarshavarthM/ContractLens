# ContractLens — AI Contract Review & Obligation Tracking Agent

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

**ContractLens** is an enterprise-grade AI contract intelligence application designed for legal teams, procurement managers, and executives. It extracts commercial metadata, maps party obligations by urgency, highlights non-standard clause risks, conducts natural language Q&A with document citations, generates executive briefings, and tracks expiring deadlines.

---

## ✨ Key Features

1. **AI Contract Metadata Extraction**
   - Extracts contracting parties, effective & expiration dates, governing jurisdiction, payment terms, renewal triggers, and termination notice windows with verbatim clause citations.
2. **Obligation & Responsibility Tracker**
   - Categorizes obligations by party (`Party A`, `Party B`, `Both`), urgency (`Immediate`, `Critical`, `Routine`), deadline, penalties, and source clause references.
3. **Time Management & Milestone Timeline**
   - Interactive chronological timeline mapping notice windows, cure periods, and delivery deadlines with visual status badges and countdown clocks.
4. **Clause Risk & Audit Analysis**
   - Flags predatory, vague, or one-sided legal provisions (`High`, `Medium`, `Low`), quotes problematic contract text, and provides battle-tested renegotiation fallback clauses.
5. **Natural Language Legal Q&A (Ask AI)**
   - Query contract clauses in plain English with instant answers supported by exact section citations.
6. **Side-by-Side Version Diff**
   - Compares contract revisions (e.g., v1.0 vs v2.0) with redline diffs and automated risk impact assessments.
7. **Proactive Deadline Alerts**
   - Real-time notification banners identifying overdue commitments, obligations due within 7 days, and 30-day renewal notice triggers.
8. **Executive Summary Briefings**
   - Generates high-level legal summaries ready for one-click browser print / PDF export.
9. **Authentication & User Management**
   - Built-in login and registration system with instant 1-click Demo access.
10. **Modern Dual-Theme UI**
    - High-aesthetic dashboard mirroring modern enterprise design with seamless Light / Dark theme switching.

---

## 🚀 Quick Demo Credentials

For quick evaluation, click **"Sign In as Demo User (1-Click)"** on the login modal or use:

- **Email**: `demo@contractlens.ai`
- **Password**: `demo123`
- **Role**: `Lead Legal Counsel & Contract Manager`
- **Employee ID**: `#EMP07`

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Lucide Icons, Zustand
- **Backend**: FastAPI (Python), PyMuPDF (`fitz`), Pydantic
- **AI Engine**: Google Gemini API (default model `gemini-3.6-flash`, configurable via `GEMINI_MODEL` / `GEMINI_FALLBACK_MODEL`) via `google-generativeai`

---

## 📦 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/SriHarshavarthM/ContractLens.git
cd ContractLens
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure Gemini API Key
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY
# GEMINI_API_KEY=your_actual_gemini_api_key_here

# Start backend server (Port 8000)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install packages
npm install

# Start Vite development server (Port 5173)
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 🔒 Environment Variables

In `backend/.env`:
```env
GEMINI_API_KEY=your_api_key_here
# Optional model selection (defaults to the current gemini-3.6-flash):
# GEMINI_MODEL=gemini-3.6-flash
# GEMINI_FALLBACK_MODEL=gemini-3.6-flash
```
You can also configure or update the Gemini API key directly from the web interface using the top navigation bar settings button without restarting the servers.
> Note: deprecated model ids (`gemini-2.5-pro`,`gemini-2.5-flash`, etc.) return `404 ... no longer available` for new accounts — always use a current id like `gemini-3.6-flash`.

---

## 📄 License
MIT License. Built for hackathon innovation.
