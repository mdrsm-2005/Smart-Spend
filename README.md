# 💡 Smart Expense Tracker & Financial AI Engine

A complete full-stack web application designed to help users radically transform how they track, manage, and optimize their daily finances. Built for scalability and "hackathon-level" innovation, it combines traditional expense tracking with bleeding-edge AI to automate data entry and provide actionable financial advice.

## 🚀 Key Innovation Highlights

### 1. AI Auto-Sync (SMS/Email Detection)
Automatically parses financial transactions from raw SMS/Email text via regular expressions and natural language categorization.
- Detects amount, merchant, and method (UPI, Card, NetBanking).
- Identifies potential duplicate transactions safely through Transaction ID tracking.
- Fallback anomaly check across 5-minute ingestion windows securely adding exactly what you paid without manual entry.

### 2. OCR Smart Receipt & GST Scanner
Integration with **Tesseract.js** directly on the client side:
- Instantly extract exact Base Amounts, Vendor names, and GST variables directly from physical printed receipts.
- Includes a dedicated **GST Tracker** tab meant to isolate total GST paid across shopping runs for smart claim calculations or business tracking.

### 3. Voice-to-Text Expense Entry
Tired of typing? Press the "Smart Voice Entry" mic, explicitly dictate your purchase (e.g., *"Spent 450 rupees on Domino's Pizza"*). The engine transcribes your speech, extracts the numbers, determines the category using keyword maps, and populates the form for final review.

### 4. Smart Financial Insights
A dedicated Insight engine analyzes dynamic spending histories. Features include:
- **Budget Alerts:** Immediate visual UI alerts dynamically calculating percentage threshold crossings (80%, 100%).
- **Goals Progress:** Define target values, predict completion times dynamically formatting month strings to readable `~ X years`.
- **AI Analytics Text Engine:** Predicts savings capability based on categories, providing dynamic UI tags (`↑ ₹450 (12%) more than last month`).
- **Investment Recommendations:** "You saved ₹2,000 this month. If you map it to a 12% SIP..."

### 5. Chat Assistant
Floating bot on the dashboard analyzing live charts to tell users exactly where their money is bleeding.

---

## 🛠️ Technology Stack
**Frontend:**
- React.js (Vite)
- React Router DOM
- Chart.js (react-chartjs-2)
- PapaParse (CSV Parsing)
- Html2Pdf (Export formatting)
- Tesseract.js (Optical Character Recognition)

**Backend:**
- Node.js & Express.js server
- MongoDB (Mongoose Schemas for User, Expense, Budget, Goals, GST)
- JSON Web Token (JWT) Authentication
- Bcrypt (Password Hashing)

---

## ⚙️ Installation & Usage (Local Deployment)

### 1. Requirements
Ensure you have **Node.js** (v18+) and **MongoDB** (Local instance or Atlas URI) installed.

### 2. Clone the Repository
```bash
git clone https://github.com/mdrsm-2005/Smart-Spend.git
cd Smart-Spend
```

### 3. Setup the Backend
```bash
cd backend
npm install
```
- Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart-expense
JWT_SECRET=your_super_secret_jwt_key
```
- Run the backend:
```bash
npm run dev
```

### 4. Setup the Frontend (React App)
```bash
# Open a new terminal window
cd react-frontend
npm install
npm run dev
```
- The frontend will host successfully on `http://localhost:5173`.
- The dashboard is equipped with fully integrated API wrappers safely talking to `http://localhost:5000/api`.

---

## 🏗️ Implementation Phases (Hackathon Process)

*   **Phase 1: Architecture & API Foundation:** Establish the MongoDB models. Expose foundational APIs for CRUD transactions and user Authentication (`POST /auth/register`, `POST /auth/login`).
*   **Phase 2: React Component Hierarchy:** Migrate fundamental vanilla JS templates to React hooks. Construct dynamic Dashboards bridging Chart.js arrays with state variables `TABS.OVERVIEW`, `TABS.HISTORY`.
*   **Phase 3: Charting, Analysis, & Metrics:** Expand data mappings. Map past 3-month windows dynamically against immediate month metrics. Inject colored UI arrows indicating growth trends.
*   **Phase 4: Integrations (OCR, Dictation):** Embed WebSpeech API for Voice Recognition inputs. Offload Image processing for receipts via Tesseract Worker to maintain browser performance.
*   **Phase 5: AI Engine Formulation:** Construct dynamic strings returning actionable human-written analysis on top-spending metrics. Bind variables into Insight templates. Develop `/api/insights/goal-insights`.
*   **Phase 6: The Automation Push:** Build SMS auto-parser schema handling text blobs returning rigid `(Vendor, Amount, Category)`. Bind this action to a visual simulator in the dashboard.
*   **Phase 7: Optimization & Aesthetics:** Modernize component layouts. Overhaul form padding, borders, and interaction states relying on unified CSS global variables. Ensure zero console errors across `toast` calls.

---

*Project built for modern web and financial management hackathons.*
