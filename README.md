# RubiMedik Health Monorepo

RubiMedik is a high-fidelity healthcare ecosystem designed to bridge the gap between patients, medical specialists, donors, and hospitals. It leverages AI-driven triage, real-time communication, and a secure financial infrastructure.

## 🏗 Project Architecture

This is a **Turbo Monorepo** managed with `pnpm`:

- **Backend (`apps/api`):** NestJS framework with PostgreSQL (TypeORM) and Redis. Integrates Gemini AI, Paystack, Agora (Video), and Expo Push Notifications.
- **Mobile (`apps/mobile`):** Expo (React Native) cross-platform app. Uses TanStack Query for state management, Zustand for auth/security stores, and Reanimated for fluid UI.
- **Admin Dashboard (`apps/admin`):** React (Vite) web application for platform governance, KYC verification, and support management.
- **Shared (`packages/shared`):** Centralized TypeScript interfaces, Enums (Status/Roles), and business logic constants used across all apps.

---

## 🌟 Core Features & Functionality

### 1. Multi-Role Ecosystem
Users can toggle between roles within a single account:
- **Patients:** Search specialists, book consultations, use AI symptom checker.
- **Specialists:** Manage professional profiles, handle video/chat consultations, manage earnings.
- **Donors:** Track eligibility, find nearby blood requests, earn impact rewards.
- **Hospitals:** Post blood requests, verify donations, manage local inventory.
- **Admins:** KYC verification, financial oversight, support escalation.

### 2. Medical Consultations & Telehealth
- **Dynamic Booking:** Tiered packages (Quick 15m, Standard 30m, Premium 60m).
- **Integrated Communication:** Secure real-time Chat and high-quality Video Calls (Agora).
- **Safety & Quality:** Automated 48-hour payout hold after completion to allow for dispute window.
- **Feedback Loop:** Mandatory double-sided reviews for every session.

### 3. Blood Donation Management
- **Matching Engine:** Connects hospitals with matching blood types in their geographic vicinity.
- **AI Health Check:** Automated donor eligibility screening (Age, Weight, recovery period).
- **Platform Reserve Policy:** A unique "40% Share" model where 2 out of every 5 units donated are reserved for platform-wide emergency inventory.
- **Verification:** Token-based secure check-in system for donation verification.

### 4. AI-Powered Support & Triage (Gemini AI)
- **Support Assistant:** 24/7 AI first-responder for user inquiries and technical issues.
- **Automated Escalation:** AI automatically detects complex disputes or medical emergencies and escalates to human Admins.
- **Health Pulse:** Context-aware health tips generated based on user bio-data (blood group, genotype).
- **Recovery Plans:** Automated post-donation recovery advice for donors.

### 5. Financial Infrastructure (Paystack)
- **Unified Wallet:** Fund via Card or Bank Transfer; support for peer-to-peer transfers.
- **Secure Withdrawals:** Real-time bank account name resolution via Paystack API (10-digit auto-fetch).
- **Referral Rewards:** Point-based system (500 points per verified referral) redeemable for wallet credit.

### 6. Security & Governance
- **App Lock:** Bio-metric or PIN-based security for the mobile app.
- **2FA:** Email-based Two-Factor Authentication for sensitive operations.
- **KYC Workflow:** Multi-stage verification for Specialists (License/Certification) and Hospitals (Medical Registration).

---

## 🛠 Prerequisites

- Node.js 20+ (Required for `crypto.randomUUID()`)
- pnpm 10+
- Docker (PostgreSQL 15+, Redis)

## 📦 Setup & Installation

1. **Install Dependencies:** `pnpm install`
2. **Infrastructure:** `docker-compose up -d`
3. **Environment:** Setup `.env` in `apps/api` using `.env.example`.
4. **Development:** 
   - Start API: `pnpm dev --filter api`
   - Start Mobile: `pnpm dev --filter mobile`
   - Start Admin: `pnpm dev --filter admin`

---

## 🚢 Deployment Configuration

- **API:** Hosted on Railway (Dockerfile at root). Requires Node 20 runtime.
- **Admin:** Optimized for Vercel/Railway.
- **Database:** PostgreSQL with `uuid-ossp` extension enabled.

---
© 2026 RubiMedik Health. Comprehensive Telemedicine & Blood Management Platform.
