# NeuroCore — AI-Powered Reading Assistant

> Adaptive reading for students with dyslexia, ADHD, and reading disabilities.

---

## ✨ Features

- 📄 **Upload** PDF, DOCX, or TXT documents
- 🤖 **AI Simplification** — Gemini AI rewrites each chunk in plain language
- 📖 **OpenDyslexic font**, colour overlays, adjustable font size and line spacing
- 👁️ **Eye Tracking** — WebGazer.js monitors focus and rereading (falls back to manual mode)
- ⚡ **Adaptive Engine** — font, spacing and chunk size adjust automatically
- 📝 **Comprehension Quizzes** after each section
- 📚 **Vocabulary tooltips** for difficult words
- 🌙 **Dark & Light theme**
- 🔒 **Privacy-first** — eye tracking data never leaves the browser

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local or [MongoDB Atlas](https://cloud.mongodb.com) free tier)
- **Gemini API Key** (free at [Google AI Studio](https://aistudio.google.com/app/apikey))

---

### Step 1 — Clone & install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2 — Configure environment

```bash
# In the backend/ folder, copy the example env file
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/neurocore
JWT_SECRET=choose_any_long_random_string_here
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
```

> **No Gemini API Key?** The app still works — it just won't simplify text.  
> Get a free key at: https://aistudio.google.com/app/apikey

---

### Step 3 — Start MongoDB

**Option A: Local MongoDB**
```bash
mongod
```

**Option B: MongoDB Atlas (cloud)**
- Create a free cluster at https://cloud.mongodb.com
- Copy the connection string and paste it as `MONGODB_URI` in `.env`

---

### Step 4 — Run the app

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# App opens at http://localhost:3000
```

---

## 📁 Project Structure

```
neurocore/
├── backend/
│   ├── models/          # MongoDB schemas (User, Document, Session)
│   ├── routes/          # Express API routes
│   ├── services/        # Gemini AI + Adaptive Engine
│   ├── utils/           # File parser + Text chunker
│   ├── middleware/       # JWT auth
│   └── server.js        # Entry point
│
└── frontend/
    └── src/
        ├── pages/       # LoginPage, RegisterPage, Dashboard, Reading, Settings
        ├── components/  # Button, Navbar, FileUpload, Quiz, VocabTooltip, Controls
        ├── hooks/       # useEyeTracking, useReadingSession
        ├── context/     # AuthContext, ThemeContext
        └── utils/       # Axios API instance
```

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/profile` | Update reading profile |
| POST | `/api/documents/upload` | Upload a document |
| GET | `/api/documents` | List all user documents |
| GET | `/api/documents/:id/chunk/:index` | Get a processed chunk |
| POST | `/api/documents/:id/chunk/:index/resimplify` | Re-simplify a chunk |
| DELETE | `/api/documents/:id` | Delete document |
| POST | `/api/sessions/start` | Start/resume session |
| POST | `/api/sessions/:id/snapshot` | Save reading snapshot |
| POST | `/api/adaptations/process` | Process behavioral data → adaptations |

---

## ⚠️ Edge Cases Handled

| Scenario | Solution |
|----------|----------|
| No webcam / permission denied | Falls back to manual difficulty reporting |
| Poor lighting / low eye tracking confidence | Signals below 60% confidence discarded |
| Gemini API rate limit | Exponential backoff (1s → 2s → 4s), 3 retries |
| Very large document (200+ pages) | First 5 chunks pre-processed; rest processed on demand |
| Browser closed mid-session | 30s auto-snapshot + beforeunload save + localStorage fallback |
| MongoDB unavailable | localStorage caches session state; syncs on reconnect |
| File parse failure | Clear error message; file cleaned up |

---

## 🎨 Accessibility Features

- **OpenDyslexic font** — bottom-heavy letters to reduce letter confusion
- **Lexend font** — designed to reduce visual stress while reading
- **Colour overlays** — Yellow, Blue, Green, Pink, Peach to reduce glare
- **Focus mode** — greys out everything except the current text block
- **Large font support** — up to 32px
- **Line spacing** — up to 3.0× for comfortable reading
- **Keyboard accessible** — all interactive elements focusable
- **Dark & light themes** — high contrast options

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| AI | Google Gemini 1.5 Flash |
| Eye Tracking | WebGazer.js (browser-based) |
| File Parsing | pdf-parse, mammoth |
| Auth | JWT (bcryptjs) |
| File Upload | Multer |

---

## 🔐 Privacy

- WebGazer processes video frames **entirely in your browser**
- **Zero video data** is sent to any server
- Only aggregated behavioral numbers (e.g. "time on chunk: 45s") are sent
- FERPA/COPPA compliant by design

---

## 📝 License

MIT — free to use and modify.
