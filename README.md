# SmartSplit

**AI-powered group expense management.** Upload a receipt or just describe an expense in plain language — SmartSplit extracts, itemizes, categorizes, predicts participants, and optimizes settlements automatically.

> *"Just say it or snap it — SmartSplit does the math."*

---

## ✨ Features

- 🧾 **Receipt OCR** — snap a photo, get merchant, line items, tax, and total extracted automatically
- 💬 **Natural language entry** — type "Dinner $84, split with Raj and Meena" and it's done
- 🔮 **Participant prediction** — AI suggests who was likely involved, based on group history
- 🧮 **Smart splitting** — equal, percentage, item-wise, or custom fixed-amount splits
- 🔁 **Duplicate detection** — never accidentally log the same receipt twice
- 📊 **Debt simplification** — minimum-transaction settlement using graph algorithms
- ⚡ **Real-time sync** — live updates across group members via WebSockets
- 📈 **Analytics dashboard** — spending insights by category, time, and group

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js, TypeScript, Tailwind CSS, Shadcn/UI, Zustand, React Query, Socket.io Client |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, Clerk Auth, Socket.io |
| **AI** | Gemini Vision (OCR), Gemini 2.5 (NLP, prediction, insights) |
| **Infra** | Docker |

---

## 📁 Project Structure

This is a monorepo:

```
SmartSplit/
├── client/       # Next.js frontend
├── server/       # Express backend (API, sockets, business logic)
├── ai-service/   # Gemini-based AI microservice
├── shared/       # Shared types/utilities across packages
├── docs/         # Documentation
└── docker/       # Containerization & deployment configs
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- Docker & Docker Compose
- MongoDB instance (local via Docker, or Atlas)
- Clerk account (for authentication keys)
- Google AI Studio / Gemini API key

### Installation

```bash
# Clone the repo
git clone https://github.com/Garvgoel23/SmartSplit.git
cd SmartSplit


## 🧩 Core Modules

**Backend:** Clerk auth integration, group management, expense APIs, balance engine, debt simplification algorithm, Socket.io events, analytics service.

**AI Service:** Receipt OCR, item extraction, category prediction, natural language parsing, participant prediction, duplicate detection, spending insights.

**Frontend:** Dashboard, groups, expenses, settlements, analytics, profile/settings, receipt upload, AI suggestions, real-time updates.

---

## 📄 License

This project is licensed under the MIT License. See `LICENSE` for details
