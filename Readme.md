Here is a complete, polished README for Credibility Guardian that covers setup, usage, architecture, and deployment details. 

# Credibility Guardian

A modern, AI‑powered analyzer that evaluates article URLs, pasted text, and uploaded documents for credibility, bias, and manipulative techniques, with a premium black‑gold iOS‑style React frontend and a Python Flask backend.

### Contents
- Overview
- Features
- Tech stack
- Architecture
- Quick start
- API reference
- Frontend usage
- Quality and security
- Deployment
- Troubleshooting
- Roadmap
- License

### Overview
Credibility Guardian helps evaluate content credibility by extracting text from web pages or documents and analyzing it with the Gemini model to detect bias, logical fallacies, and manipulative techniques. Results are returned as structured JSON and visualized with a premium, animated UI.

### Features
- URL analysis with resilient scraping and auto‑validation.
- Direct text analysis with structured JSON output.
- Document analysis for PDF, DOC, DOCX, TXT, and RTF with server‑side extraction.
- Premium black‑gold iOS‑style interface with glassmorphism and advanced animations.
- Clear credibility score, summary, and detected techniques.
- Robust error handling and health endpoint.
- Local development simplicity with .env configuration.

### Tech stack
- Backend: Python 3.10+, Flask, Flask‑CORS, Google Generative AI SDK (Gemini), pdfplumber, python‑docx, striprtf.
- Frontend: React (Vite, SWC), Axios, custom CSS animations and effects.
- DevOps: Local development with virtualenv and Vite, deployable to Google Cloud and Vercel.

### Architecture
- Single backend service exposing:
  - POST /analyze for type “url”, “text” (JSON) and “document” (multipart/form‑data).
  - GET /health for service status.
- Frontend single‑page app providing three tabs: URL, Text, and Document; animated, responsive UI; Axios integration to backend.

### Quick start

#### Prerequisites
- Python 3.10+ and pip
- Node.js 18+ and npm
- A Google API key for the Gemini model

#### Backend setup
1) Create environment file (backend/.env):
```
GOOGLE_API_KEY=replace_with_real_key
FLASK_ENV=development
PORT=8080
```

2) Install dependencies:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

3) Run the API:
```bash
python server.py
```

4) Verify health:
```bash
curl http://localhost:8080/health
```

#### Frontend setup
1) Install and run:
```bash
cd frontend
npm install
npm run dev
```

2) Open the development URL from the terminal (typically http://localhost:5173).

Optional: to externalize the backend URL, add a .env file in frontend with:
```
VITE_API_BASE=http://localhost:8080
```
Then replace hardcoded endpoints with import.meta.env.VITE_API_BASE in code.

### API reference

#### Analyze: URL or Text
- Endpoint: POST /analyze
- Content-Type: application/json
- Body:
```
{
  "type": "url",    // or "text"
  "data": "https://example.com/article" // or a long text string
}
```
- Success response (shape):
```
{
  "credibility_score": 0-100,
  "summary_of_claims": "one-sentence summary",
  "analysis": {
    "overall_assessment": "short assessment",
    "manipulative_techniques": [
      {
        "technique": "name",
        "explanation": "why it is problematic",
        "flagged_quote": "evidence from text"
      }
    ]
  },
  "analysis_type": "url" | "text",
  "original_input": "echo or preview of submitted content"
}
```
- Error examples:
  - 400: invalid JSON, short text, or scraping failure.
  - 500: analysis failure or unexpected error.

#### Analyze: Document
- Endpoint: POST /analyze
- Content-Type: multipart/form-data
- Body: file field named file (one of .pdf, .doc, .docx, .txt, .rtf; up to 10 MB)
- Success response (adds document metadata):
```
{
  ...same fields as above,
  "analysis_type": "document",
  "document_info": {
    "filename": "name.ext",
    "file_type": "pdf|doc|docx|txt|rtf",
    "text_length": 12345,
    "content_preview": "first 200 chars…"
  }
}
```
- Error examples:
  - 400: missing file, unsupported type, too short extracted text.
  - 413: file too large.
  - 500: extraction or analysis failure.

#### Health
- Endpoint: GET /health
- Response:
```
{
  "status": "healthy",
  "service": "Credibility Analyzer API",
  "api_configured": true,
  "supported_formats": ["pdf","doc","docx","txt","rtf"],
  "max_file_size": "10MB"
}
```

### Frontend usage
- Tabs: URL, Text, Document.
- URL tab: smart validation with auto‑correction for missing protocol; inline feedback.
- Text tab: character counter with minimum length indicator.
- Document tab: file picker with type/size validation and animated upload progress.
- Results: animated circular score, overall assessment, summary, and techniques list.
- Errors: clear messages with retry action and consistent design styling.

### Quality and security
- Input validation for URLs, text length, and file types.
- File size limit with proper HTTP 413 handling.
- Temporary file storage with cleanup after extraction.
- Descriptive error responses and structured logging.
- CORS enabled for local development; restrict origins for production.

### Deployment

#### Backend
- Option A: Google Cloud Functions or Cloud Run.
- Steps outline:
  - Set GOOGLE_API_KEY as a secure runtime secret.
  - Configure CORS for the production frontend origin.
  - Use a stable region and minimum instances if using Cloud Run for cold‑start mitigation.
  - Add structured logging to simplify debugging in cloud logs.

#### Frontend
- Option A: Vercel (recommended) or Netlify.
- Steps outline:
  - Set VITE_API_BASE to the deployed backend URL in project environment settings.
  - Build and deploy via connected repository or CLI.
  - Verify CORS and HTTPS.

### Troubleshooting
- URL marked invalid: updated validation logic uses the URL constructor and auto‑adds protocol when missing.
- Scraping returns short content: site may be behind a paywall or block scripts; try “Text” or “Document” analysis.
- PDF text empty: likely image‑only; convert to searchable PDF (OCR) before uploading.
- 500 errors from analysis: check GOOGLE_API_KEY and model availability; inspect server logs.
- CORS errors in browser: configure allowed origins to match the deployed frontend domain.

### Roadmap
- OCR for image‑based PDFs.
- Caching for recently analyzed URLs.
- Rate limiting and API keys for public endpoints.
- Report export (PDF/Markdown) and shareable links.
- History with saved analyses and tags.
- Internationalization and accessibility enhancements.

### License
?