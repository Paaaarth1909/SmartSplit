# SmartSplit — Full-Stack Deployment Guide from Scratch

This guide provides complete, step-by-step instructions for deploying the **SmartSplit** application to production from scratch. It covers the **Database (MongoDB)**, **Backend (Express + WebSockets + Gemini AI)**, and **Frontend (Next.js 15 App Router)**.

---

## 📐 Architecture Overview

```mermaid
flowchart TD
    Client["Client Browser / Mobile PWA\n(Next.js 15)"]
    Vercel["Frontend Host\n(e.g., Vercel / Cloudflare)"]
    Backend["Backend Service\n(Node.js + Express + Socket.io)\ne.g., Render / Railway / VPS"]
    Mongo["Database\n(MongoDB Atlas Cluster)"]
    Gemini["Google Gemini AI API\n(Receipt OCR & NLP Parsing)"]

    Client -->|HTTPS Static & Pages| Vercel
    Client -->|REST API /api/*| Backend
    Client <-->|WSS WebSockets /socket.io/*| Backend
    Backend <-->|Mongoose Driver| Mongo
    Backend -->|Vision & Text SDK| Gemini
```

### Components Breakdown
1. **Database:** MongoDB (MongoDB Atlas cloud cluster or self-hosted MongoDB 6.0+).
2. **Backend:** Node.js (v18+) + Express + Socket.io + JWT Authentication + Google Gemini SDK (`server/`).
3. **Frontend:** Next.js 15 + React 19 + Tailwind CSS + Lucide Icons + Socket.io Client (`client/`).
4. **Third-Party Services:** Google AI Studio (Gemini 2.5 / Vision API).

---

## 📋 Prerequisites Checklist

Before you start, make sure you have:
- [ ] A **GitHub** account with your SmartSplit repository pushed.
- [ ] A **Google AI Studio** account ([aistudio.google.com](https://aistudio.google.com/)) to generate a Gemini API key.
- [ ] A **MongoDB Atlas** account ([mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register)) for cloud database hosting (free tier available).
- [ ] An account on a persistent container/runtime platform for backend: **Render** ([render.com](https://render.com)) or **Railway** ([railway.app](https://railway.app)).
- [ ] A **Vercel** account ([vercel.com](https://vercel.com)) for hosting the Next.js frontend.
- [ ] (Optional) An **Ubuntu VPS** (DigitalOcean / Hetzner / AWS EC2) if you prefer self-hosting with Docker & Nginx.

---

## 🗄️ Step 1: Database Setup (MongoDB Atlas)

SmartSplit uses MongoDB with Mongoose for storing users, groups, expenses, balances, and chat messages.

### 1.1 Create a Cluster
1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Click **Create** to deploy a new database.
3. Choose the **M0 Free (Shared)** tier.
4. Select your preferred Cloud Provider (AWS, GCP, or Azure) and the region closest to your backend hosting region.
5. Click **Create Cluster**.

### 1.2 Create Database User Credentials
1. In the Atlas dashboard, navigate to **Security** → **Database Access**.
2. Click **Add New Database User**.
3. Choose **Password** authentication:
   - **Username:** `smartsplit_admin` (or your choice)
   - **Password:** Click *Autogenerate Secure Password* and copy it to a secure note.
4. Under **Database User Privileges**, select **Read and write to any database**.
5. Click **Add User**.

### 1.3 Configure Network Access (IP Whitelist)
Because cloud platforms like Render, Railway, or Vercel use dynamic outbound IP addresses, you need to allow access from any IP:
1. In the Atlas dashboard, go to **Security** → **Network Access**.
2. Click **Add IP Address**.
3. Select **Allow Access from Anywhere** (`0.0.0.0/0`).
4. Set a comment like `Allow Cloud Services`.
5. Click **Confirm**.

### 1.4 Retrieve the Connection String
1. Go to **Deployment** → **Database**.
2. Click the **Connect** button on your cluster.
3. Choose **Drivers** (Node.js).
4. Copy the connection string format:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Append your target database name (e.g. `smartsplit`) before the `?` query parameter:
   ```text
   mongodb+srv://smartsplit_admin:<your_password>@cluster0.xxxx.mongodb.net/smartsplit?retryWrites=true&w=majority
   ```
6. Save this connection string as your `MONGODB_URI`.

---

## 🔑 Step 2: Third-Party & Security Keys Setup

### 2.1 Google Gemini AI API Key
SmartSplit uses Gemini for receipt OCR image parsing, natural language expense entry, and participant prediction.
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **Create API Key**.
4. Select an existing Google Cloud project or create a new one.
5. Copy the generated key. This will be your `GEMINI_API_KEY`.

### 2.2 JWT Secret Key
Generate a strong random 256-bit string for signing user authentication tokens.
On your local terminal (macOS/Linux/Git Bash/PowerShell), run:
```bash
# On Linux/macOS/Git Bash:
openssl rand -base64 32

# Or in Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Save this value as your `JWT_SECRET`.

---

## 🚀 Step 3: Backend Deployment (Express + WebSockets)

> [!IMPORTANT]
> **Why Persistent Hosting is Required:**
> SmartSplit uses **Socket.io** for real-time notifications, instant balance sync, and in-group live chat. Serverless platforms (such as Vercel Functions or AWS Lambda) cannot maintain persistent WebSocket connections. You **must** deploy the backend to a long-running container service like **Render**, **Railway**, **Fly.io**, or a **VPS**.

We will demonstrate deploying on **Render** (free/cheap tier available with WebSocket support):

### 3.1 Deploying Backend on Render

1. Log in to [Render](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`Garvgoel23/SmartSplit`).
4. Configure the service parameters:
   - **Name:** `smartsplit-backend`
   - **Region:** Choose the region closest to your MongoDB Atlas cluster (e.g. Frankfurt, Oregon, Singapore).
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Plan:** Free or Starter.

5. Scroll down to **Environment Variables** and add the following:

   | Key | Value Example | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Node environment |
   | `PORT` | `10000` | Port assigned by Render (or 5050) |
   | `MONGODB_URI` | `mongodb+srv://.../smartsplit?...` | Your MongoDB Atlas connection URI |
   | `JWT_SECRET` | `your_generated_32_byte_secret` | Secret for auth token generation |
   | `JWT_EXPIRES_IN` | `7d` | Token validity period |
   | `GEMINI_API_KEY` | `AIzaSy...` | Google AI Studio API key |

6. Click **Deploy Web Service**.
7. Once deployment finishes, Render assigns you a public URL, for example:
   `https://smartsplit-backend.onrender.com`
8. Verify your backend is running by opening the health-check endpoint in your browser:
   `https://smartsplit-backend.onrender.com/health`
   Expected response:
   ```json
   { "status": "ok", "message": "Server is operational" }
   ```

---

## 🌐 Step 4: Frontend Deployment (Next.js 15 on Vercel)

Vercel is the native platform for Next.js and provides optimal edge rendering, automatic asset optimization, and zero configuration.

### 4.1 Deploying Frontend on Vercel

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository (`SmartSplit`).
4. In the **Configure Project** screen:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click **Edit** and choose `client`.
5. Under **Environment Variables**, add the public backend endpoints:

   | Name | Value | Note |
   |---|---|---|
   | `NEXT_PUBLIC_API_URL` | `https://smartsplit-1qz1.onrender.com/api` | Points to the backend Express API |
   | `NEXT_PUBLIC_SOCKET_URL` | `https://smartsplit-1qz1.onrender.com` | Base backend URL for WebSockets |

   > [!WARNING]
   > `NEXT_PUBLIC_*` variables are embedded into the client-side JavaScript bundle **at build time**. If your backend URL changes later, you must trigger a redeployment of the frontend.

6. Click **Deploy**.
7. Vercel will run `npm run build` and output your live production URL (e.g. `https://smartsplit-app.vercel.app`).

---

## 🐳 Step 5: Alternative Deployment — Single VPS with Docker & Nginx

If you prefer self-hosting on your own Linux VPS (Ubuntu 22.04 / 24.04 on DigitalOcean, AWS EC2, Linode, or Hetzner), you can run all components using Docker Compose and Nginx with free SSL via Let's Encrypt.

### 5.1 Project Dockerfiles

#### Backend Dockerfile (`server/Dockerfile`)
```dockerfile
# Multi-stage build for TypeScript backend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 5050
CMD ["node", "dist/server.js"]
```

#### Frontend Dockerfile (`client/Dockerfile`)
```dockerfile
# Multi-stage build for Next.js 15
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time public arguments
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

#### Root `docker-compose.yml`
Place this in the root of the repository:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: smartsplit-db
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: smartsplit_admin
      MONGO_INITDB_ROOT_PASSWORD: strong_db_password
      MONGO_INITDB_DATABASE: smartsplit
    volumes:
      - mongo_data:/data/db
    ports:
      - "127.0.0.1:27017:27017"

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: smartsplit-backend
    restart: always
    environment:
      PORT: 5050
      MONGODB_URI: mongodb://smartsplit_admin:strong_db_password@mongodb:27017/smartsplit?authSource=admin
      JWT_SECRET: your_production_jwt_secret_key_here
      JWT_EXPIRES_IN: 7d
      GEMINI_API_KEY: your_gemini_api_key_here
    depends_on:
      - mongodb
    ports:
      - "127.0.0.1:5050:5050"

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://smartsplit.yourdomain.com/api
        NEXT_PUBLIC_SOCKET_URL: https://smartsplit.yourdomain.com
    container_name: smartsplit-frontend
    restart: always
    depends_on:
      - backend
    ports:
      - "127.0.0.1:3000:3000"

volumes:
  mongo_data:
```

### 5.2 Nginx Configuration (with WebSocket Support)
Install Nginx on your VPS:
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/smartsplit`:
```nginx
server {
    server_name smartsplit.yourdomain.com;

    # Frontend Next.js app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:5050/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 15M; # Allow receipt uploads
    }

    # WebSockets (Socket.io)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5050/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable site and acquire SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/smartsplit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d smartsplit.yourdomain.com
```

Launch the stack:
```bash
docker compose up -d --build
```

---

## ✅ Step 6: Post-Deployment Smoke Test Checklist

Once both services are running, verify each critical capability:

| Step | Action | Verification |
|---|---|---|
| **1. Health Check** | Visit `https://<backend-domain>/health` | Should return `{"status":"ok","message":"Server is operational"}` |
| **2. User Registration** | Go to `/register` on your frontend and create a new user | Check browser dev tools: receives JWT token and redirects to `/dashboard` |
| **3. User Login** | Log out and log back in at `/login` | Verified authentication persists in `localStorage` |
| **4. Group Creation** | Create a group (e.g. "Goa Trip") | 6-character invite code should auto-generate |
| **5. AI Receipt OCR** | Upload a sample receipt image | Gemini Vision parses merchant, items, taxes, and total amount |
| **6. AI NLP Text Entry** | Type `"Dinner $50 split equally"` | Gemini NLP accurately extracts amount, description, and split |
| **7. Real-Time Chat & Sockets** | Open the group in two separate browser windows and send a chat message | The message should appear in real time on both windows without page refresh |
| **8. Settlement Engine** | Record an expense and check "Settle Up" | Graph-based debt simplification should calculate minimum transactions |

---

## 🛠️ Step 7: Troubleshooting & Common Pitfalls

### 1. `CORS` or `Network Error` in the Browser
- **Cause:** `NEXT_PUBLIC_API_URL` is pointing to `localhost` or an incorrect domain.
- **Fix:** Verify in Vercel that `NEXT_PUBLIC_API_URL` is set to `https://<your-backend-domain>/api`. Trigger a redeploy after editing.

### 2. WebSocket Connection Fails (`polling` fallback or error)
- **Cause:** Reverse proxy (e.g. Nginx or Cloudflare) is not configured to forward `Upgrade: websocket` headers, or Vercel was mistakenly used for the backend.
- **Fix:** Ensure backend is on Render/Railway/VPS. In Nginx, make sure `proxy_set_header Upgrade $http_upgrade;` and `proxy_set_header Connection "upgrade";` are included in the `/socket.io/` block.

### 3. MongoDB Connection Timeout (`MongooseServerSelectionError`)
- **Cause:** MongoDB Atlas Network Access is blocking the server IP.
- **Fix:** In MongoDB Atlas → **Network Access**, ensure `0.0.0.0/0` (allow from anywhere) is active.

### 4. Receipt Upload Fails with `413 Payload Too Large`
- **Cause:** Nginx or proxy upload limit is lower than the receipt image size.
- **Fix:** In Nginx, add `client_max_body_size 15M;`. Note that the backend multer limit is set to 10MB in `server/src/routes/ocr.routes.ts`.

### 5. Gemini API Errors (`403 Forbidden` or `API key not valid`)
- **Cause:** Invalid or restricted Google AI Studio key.
- **Fix:** Double check the `GEMINI_API_KEY` environment variable in your backend hosting platform. Ensure billing or quota is active on Google AI Studio.

---

## 🔒 Security Recommendations for Production

1. **Rotate Secrets:** Never commit `.env` or `.env.local` to Git. Keep `.gitignore` updated.
2. **Restrict CORS:** In `server/src/server.ts`, replace `app.use(cors())` with:
   ```typescript
   app.use(cors({
     origin: process.env.CLIENT_ORIGIN || "https://smartsplit-app.vercel.app",
     credentials: true
   }));
   ```
3. **Database Backups:** Enable automated continuous backups in MongoDB Atlas under Cluster Backup Settings.
4. **Rate Limiting:** For high traffic, attach `express-rate-limit` to `/api/auth` and `/api/ai` endpoints to prevent abuse of Gemini API quotas.
