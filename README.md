# 💸 SmartSplit

**AI-powered intelligent group expense sharing, debt simplification, and real-time collaboration platform.**

SmartSplit simplifies group finances. Upload a receipt or describe an expense in natural language — SmartSplit automatically parses line items, categories, and amounts, simplifies group debts using graph algorithms, and syncs updates in real time across all members.

---

## ✨ Key Features

### 🤖 AI-Powered Expense Logging
- **Smart Receipt OCR**: Snap or upload a photo of a receipt. Powered by Google Gemini Vision, SmartSplit automatically extracts the merchant name, date, subtotal, tax, and line items.
- **Natural Language Expense Parser**: Type naturally like *"Dinner $84 with Sarah and Alex"* or *"Cab to airport 450 split equally"* — parsed instantly via Groq & Gemini NLP models.
- **Perceptual Duplicate Detection**: Hashes receipt images with perceptual hashing (`imghash`) to prevent accidental duplicate expense entries.

### 👥 Groups & Friend Networks
- **Group Management & Invite Codes**: Create groups (trips, housemates, projects) with shareable 6-character invite codes.
- **Interactive Join & Invite Approval**: Group owners can send invites or approve join requests with real-time popup notifications and activity feeds.
- **Friend Network**: Search for friends by username with email privacy protection, send friend requests, and quickly add friends to shared groups.
- **Real-Time Group Chat**: Built-in group discussions powered by Socket.IO with message persistence.

### ⚖️ Smart Splitting & Debt Simplification
- **Flexible Splitting Models**: Split equally, by custom exact amounts, percentages, or per-person shares.
- **Minimum-Transaction Debt Simplification**: Graph-based debt minimization algorithm (`calculateSettlements`) reduces complex webs of group IOUs into the minimum possible number of direct settlements.
- **One-Click Settle Up**: Record payments and record balances between members seamlessly.

### 🌍 Multi-Currency & Analytics
- **Live Currency Support**: Select and convert between global currencies (USD, EUR, GBP, INR, CAD, AUD, JPY, etc.) with real-time rate conversion.
- **Interactive Analytics**: Visual breakdown of personal and group spending habits, category distributions, and monthly balance shifts.
- **Real-Time WebSocket Sync**: Instant notifications and balance recalculations via Socket.IO whenever expenses, chats, or group requests occur.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/), [Socket.IO Client](https://socket.io/) |
| **Backend** | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/), [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/), [Socket.IO](https://socket.io/), [JWT](https://jwt.io/), [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js) |
| **AI & Vision** | [Google Gemini 2.5 / Vision](https://ai.google.dev/) (`@google/genai`), [Groq Cloud SDK](https://groq.com/) (`groq-sdk`) |
| **Deployment** | [Vercel](https://vercel.com/) (Frontend), [Render](https://render.com/) (Backend Web Service), [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) |

---

## 📁 Repository Structure

```
SmartSplit/
├── client/                     # Next.js 15 Frontend
│   ├── app/
│   │   ├── dashboard/          # Dashboard (Overview, Groups, Expenses, Friends, Activity, Settings)
│   │   ├── login/              # User Authentication Login
│   │   ├── register/           # Account Registration
│   │   ├── forgot-password/    # Password Recovery
│   │   └── page.tsx            # Landing page
│   ├── components/             # Reusable UI (SplitInputPanel, GlobalNotificationPopup, etc.)
│   └── lib/                    # API client, Socket client, Currency conversions, Auth helpers
│
├── server/                     # Express + Socket.IO Backend
│   ├── src/
│   │   ├── config/             # Database connection & environment configuration
│   │   ├── controllers/        # Express route handlers (auth, group, expense, ocr, nlp, notification, user)
│   │   ├── middleware/         # JWT auth middleware, error handling, file upload
│   │   ├── models/             # Mongoose schemas (User, Group, Expense, Balance, Notification, FriendRequest)
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Settlement algorithm & background services
│   │   ├── socket.ts           # WebSocket event handlers (chat, live notifications)
│   │   └── server.ts           # Server entry point
│   ├── .env.example            # Backend environment template
│   └── package.json
│
├── DEPLOYMENT.md               # End-to-end production deployment guide
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** or **pnpm**
- **MongoDB** instance (local MongoDB Community Server or free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster)
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))
- **Groq API Key** (from [Groq Console](https://console.groq.com/)) *(optional/fallback for NLP)*

---

### 1. Clone the Repository

```bash
git clone https://github.com/Garvgoel23/SmartSplit.git
cd SmartSplit
```

---

### 2. Backend Setup

1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in `server/` based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

   Configure the following keys:
   ```env
   PORT=5050
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/smartsplit?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API and WebSocket server will run at `http://localhost:5050`.

---

### 3. Frontend Setup

1. Open a new terminal tab and navigate to `client/`:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in `client/`:
   ```bash
   cp .env.example .env.local
   ```

   For local development:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5050/api
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5050
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Login and obtain JWT authentication token |
| `GET` | `/api/users/profile` | Get current user profile and balance summary |
| `GET` | `/api/users/friends` | List friends & pending friend requests |
| `POST` | `/api/users/friends/request` | Send friend request by username |
| `GET` | `/api/groups` | Fetch groups user is a member of |
| `POST` | `/api/groups` | Create new group |
| `POST` | `/api/groups/join` | Join group via invite code |
| `POST` | `/api/groups/:id/invite` | Send group join invitation to a friend |
| `POST` | `/api/expenses` | Create new expense with split allocations |
| `POST` | `/api/ai/ocr` | Upload receipt image for Gemini Vision OCR parsing |
| `POST` | `/api/ai/nlp` | Parse natural language expense description |
| `GET` | `/api/currencies/rates` | Fetch real-time foreign exchange conversion rates |
| `GET` | `/api/notifications` | Get user notifications and activity updates |
| `GET` | `/health` | Health-check endpoint |

---

## 🚢 Deployment

For complete, step-by-step production deployment instructions (including MongoDB Atlas configuration, Render Web Service setup with persistent WebSockets, and Vercel Next.js deployment), see [DEPLOYMENT.md](file:///Users/parthsaarthiesharma/Desktop/SmartSplit/DEPLOYMENT.md).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
