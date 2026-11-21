# MindMate — AI Mental Health Assistant

**MindMate** is an empathetic AI mental wellness assistant built with **React (JSX/TSX)**, **Node.js + Express**, and **Python**, combining structured prompt engineering with a deterministic crisis safety guardrail.

## Features

- **Empathetic AI Chat**: Three support modes — *Supportive*, *CBT Reframe*, and *Grounding* — designed for warm, concise, non-diagnostic reflection.
- **Deterministic Crisis Safety Layer**: Detects high-risk distress language in both TypeScript and Python and surfaces verified 24/7 crisis resources (`988`, Crisis Text Line `741741`, `findahelpline.com`).
- **Guided 4-4-6 Breathing & 5-4-3-2-1 Grounding**: Interactive calming exercise built directly into the web interface.
- **Dual Stack (Node.js/React + Python)**: Run the React web app, the Python CLI, or the Python Gradio UI using the same `.env` configuration.

## Project Structure

```text
mindmate/
├── README.md
├── package.json
├── server.ts                 # Node.js Express API + Vite React server
├── index.html
├── .env.example
├── .gitignore
├── src/                      # React frontend (JSX/TSX + Tailwind CSS)
│   ├── App.tsx
│   ├── components/
│   │   ├── AssistantView.tsx
│   │   ├── BreathingModal.tsx
│   │   └── CrisisBanner.tsx
│   └── utils/
│       ├── promptEngine.ts
│       ├── safety.ts
│       └── core.test.ts
└── python/                   # Python assistant (CLI + Gradio UI)
    ├── mindmate.py
    ├── prompts.py
    ├── safety.py
    ├── test_mindmate.py
    └── requirements.txt
```

## Prerequisites

- **Node.js 20+** and **npm**
- **Python 3.10+** and **pip**
- A Gemini API key

## 1. Environment Setup

Copy `.env.example` to `.env` in the project root and add your API key:

```bash
cp .env.example .env
```

```env
GEMINI_API_KEY="your_gemini_api_key_here"
```

## 2. Run the React (JSX/TSX) + Node.js App

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
# Typecheck & Node unit tests
npm run lint
npx tsx --test src/utils/core.test.ts

# Production build
npm run build
```

## 3. Run the Python Assistant

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate        # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Run Python unit tests
python -m unittest test_mindmate.py

# Run interactive terminal chat
python mindmate.py

# Or launch the Python Gradio web interface on port 7860
python mindmate.py --ui
```

## 4. Run Node + React + Python Together

Open two terminals from the project root (both read `GEMINI_API_KEY` from `.env`):

- **Terminal 1 (React + Node.js on `http://localhost:3000`):**
  ```bash
  npm run dev
  ```
- **Terminal 2 (Python Gradio UI on `http://127.0.0.1:7860`):**
  ```bash
  cd python && source .venv/bin/activate && python mindmate.py --ui
  ```

## Disclaimer

MindMate provides supportive AI reflection and breathing exercises for everyday mental wellness. It is not a medical device and does not replace licensed mental health care. If you are in crisis, call or text **988** (US & Canada), text **HOME** to **741741**, or visit [findahelpline.com](https://findahelpline.com).
