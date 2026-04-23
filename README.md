# Rubimedik Health Platform

Rubimedik is a comprehensive healthcare monorepo featuring a modular NestJS backend, an Expo mobile application, and a Next.js admin dashboard.

## 🚀 Project Overview

- **Backend (`apps/api`):** NestJS, TypeORM, PostgreSQL, Redis, Socket.io, Paystack, Anthropic (Claude AI).
- **Mobile (`apps/mobile`):** Expo (React Native), React Query, Zustand, React Navigation.
- **Admin Dashboard (`apps/admin`):** Next.js 14, Shadcn/ui, Tailwind CSS, Recharts.
- **Shared (`packages/shared`):** Shared TypeScript types and constants.

## 🛠 Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose (for local DB & Redis)

## 📦 Setup & Installation

1.  **Clone the repository**
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
3.  **Setup Environment Variables:**
    - Copy `.env.example` to `apps/api/.env` and fill in the values.
    - Copy `.env.example` to `apps/admin/.env.local`.
4.  **Start Infrastructure:**
    ```bash
    docker-compose up -d
    ```
5.  **Run Development Servers:**
    ```bash
    # Run all apps
    pnpm dev
    
    # Run specific app
    pnpm dev --filter api
    pnpm dev --filter mobile
    pnpm dev --filter admin
    ```

## 🧪 Testing

```bash
# API Unit Tests
cd apps/api && pnpm test

# API E2E Tests
cd apps/api && pnpm test:e2e

# Mobile Type Check
cd apps/mobile && npx tsc --noEmit
```

## 🚢 Deployment

### Backend (Railway)
1. Create a new project on Railway.
2. Add PostgreSQL and Redis plugins.
3. Connect your GitHub repo.
4. Set the Root Directory to `/` and the Dockerfile to `apps/api/Dockerfile`.
5. Add all environment variables from `apps/api/.env`.

### Admin Dashboard (Vercel)
1. Connect your GitHub repo to Vercel.
2. Select the `apps/admin` directory.
3. Add `NEXT_PUBLIC_API_URL` pointing to your deployed API.

### Mobile (EAS)
1. Install EAS CLI: `npm install -g eas-cli`.
2. Login: `eas login`.
3. Build: `cd apps/mobile && eas build --platform ios --profile development`.

## 📚 API Documentation

Once the backend is running, access the Swagger UI at:
`http://localhost:3000/api/docs`

## 🤝 Features

- **Multi-Role Support:** Users can switch between Patient and Donor roles seamlessly.
- **AI Triage:** Integrated Claude AI for symptom checking and specialist matching.
- **Real-time Chat:** Live consultation rooms with message history.
- **Financials:** Wallet system with Paystack integration and referral point redemption.
- **KYC Queue:** Admin verification workflow for medical specialists.

---
© 2026 Rubimedik Health. All rights reserved.
# rubimedik-monoreppo
