RUBIMEDIK
Task Tracking & Agent Build Plan
Complete Sprint Breakdown for AI-Assisted Development  •  v1.0  •  April 2025
PHASE 1
Monorepo + Backend Core	PHASE 2
Payments + Wallet	PHASE 3
Mobile App	PHASE 4
Admin + AI	PHASE 5
Polish + Deploy

Phase Overview & Timeline
Phase	Focus	Key Output	Dependencies	Duration	Total Hours
PHASE 1	Monorepo Setup, NestJS backend, Auth, DB, Swagger	Working API with auth, all modules scaffolded	None	Hours 0–6	~6h
PHASE 2	Payments, Wallet, Paystack, Referrals, Notifications	Full payment flow, wallet operations, email	Phase 1	Hours 6–12	~6h
PHASE 3	Expo React Native App — all screens and flows	Fully working mobile app for all 4 user types	Phase 1+2	Hours 12–18	~6h
PHASE 4	Admin Dashboard + AI Features + Chat	Admin panel, AI symptom checker, real-time chat	Phase 1+2+3	Hours 18–22	~4h
PHASE 5	Testing, Polish, Deploy, Documentation	Live app on Railway + Expo + Vercel	All phases	Hours 22–24	~2h

AI Agent Build Instructions
The following instructions define how the AI agent should approach the build:
Monorepo Tool	Use Turborepo. Init: npx create-turbo@latest rubimedik --use-npm
Backend Stack	NestJS 10 + TypeORM + PostgreSQL + Redis (for sessions/queue)
Mobile Stack	Expo SDK 51 + React Navigation 6 + Zustand (state) + React Query (server state)
Admin Stack	Next.js 14 App Router + Shadcn/ui + TanStack Table + Recharts
Auth Strategy	Passport.js local + jwt + google strategy. Use @nestjs/passport
ORM Entities	Create all TypeORM entities first before services — let migrations auto-generate
Swagger	Use @ApiTags, @ApiOperation, @ApiResponse on every controller. Enable in main.ts
Paystack	Use paystack npm package. Implement webhook with signature verification using HMAC-SHA512
Resend	Use resend npm package. Create EmailModule with templates for each notification type
Chat	Use @nestjs/websockets with Socket.io adapter. Create ChatGateway
AI Features	Use @anthropic-ai/sdk. Create AIModule with symptom-check and match endpoints
Error Handling	Global exception filter + class-validator DTOs on all endpoints
Environment	Use @nestjs/config with validation schema. Create .env.example
Testing	Jest unit tests for critical business logic: payments, referrals, follow-up logic
Build Order	Always build in phase order. Never start Phase N until Phase N-1 is complete
Commits	Commit after each completed task with format: feat(module): description

Master Task List
ID	Task / Deliverable	Assignee	Phase	Priority	Status	Est.
  ▸  PHASE 1 — Monorepo Setup & Backend Foundation
T001	Init Turborepo monorepo with apps/api, apps/mobile, apps/admin, packages/shared	Agent	PHASE 1	P0	TODO	1h
T002	Configure root package.json, tsconfig.base.json, turbo.json pipeline	Agent	PHASE 1	P0	TODO	1h
T003	Bootstrap NestJS app in apps/api with @nestjs/cli — configure main.ts, app.module.ts	Agent	PHASE 1	P0	COMPLETED	1h
T004	Setup PostgreSQL + TypeORM — database.module.ts, ormconfig, env vars	Agent	PHASE 1	P0	COMPLETED	1h
T005	Create all TypeORM entities: User, SpecialistProfile, Wallet, Transaction, Consultation, Appointment, BloodRequest, DonationMatch, Referral, Message, ChatRoom, ReferralCode	Agent	PHASE 1	P0	COMPLETED	2h
T006	Run initial TypeORM migration to create all tables	Agent	PHASE 1	P0	COMPLETED	1h
T007	Implement AuthModule: email/password signup, login, JWT access+refresh tokens, guards	Agent	PHASE 1	P0	COMPLETED	2h
T008	Implement Google OAuth strategy with Passport.js — /auth/google endpoint	Agent	PHASE 1	P0	TODO	1h
T009	Email OTP verification flow — generate OTP, store in Redis with TTL, verify endpoint	Agent	PHASE 1	P0	TODO	1h
T010	Password reset flow — request OTP, verify, reset endpoint	Agent	PHASE 1	P0	TODO	1h
T011	UsersModule — CRUD endpoints for all user types, role-based profile setup, KYC upload	Agent	PHASE 1	P0	COMPLETED	2h
T012	SpecialistModule — consultation package CRUD, availability slot management	Agent	PHASE 1	P0	COMPLETED	2h
T013	ConsultationModule — booking, status machine (UPCOMING→IN_PROGRESS→COMPLETED), follow-up logic	Agent	PHASE 1	P0	COMPLETED	3h
T014	Follow-up tracking: track followUpCount, followUpUsed, followUpWindowDays per consultation	Agent	PHASE 1	P0	TODO	1h
T015	BloodDonationModule — hospital blood requests, donor matching, status tracker	Agent	PHASE 1	P0	COMPLETED	2h
T016	HospitalModule — hospital profile, donation intake, referral receipt endpoints	Agent	PHASE 1	P1	COMPLETED	1h
T017	ReferralModule — unique code generation, track referral signups, point award on first consultation	Agent	PHASE 1	P0	COMPLETED	1h
T018	Setup Swagger via @nestjs/swagger — all controllers tagged, DTOs documented, bearer auth	Agent	PHASE 1	P0	COMPLETED	1h
T019	Global exception filter, validation pipe (class-validator), helmet, rate limiting (throttler)	Agent	PHASE 1	P0	TODO	1h
T020	Cloudinary integration for file uploads (avatars, KYC docs, chat media)	Agent	PHASE 1	P1	TODO	1h
  ▸  PHASE 2 — Payments, Wallet, Referrals, Notifications
T021	WalletModule — wallet entity, balance tracking, credit/debit operations with ledger	Agent	PHASE 2	P0	COMPLETED	2h
T022	Paystack integration — initialize transaction, verify payment, fund wallet endpoint	Agent	PHASE 2	P0	COMPLETED	2h
T023	Paystack webhook handler — verify HMAC-SHA512 signature, process events	Agent	PHASE 2	P0	COMPLETED	1h
T024	Consultation payment flow — escrow on booking, release on completion (80% specialist, 20% platform)	Agent	PHASE 2	P0	COMPLETED	2h
T025	Hybrid payment: referral points first, wallet balance for remainder, Paystack for shortfall	Agent	PHASE 2	P0	COMPLETED	2h
T026	Cancellation engine — apply policy (>48h/24-48h/<24h), compute refund, process via wallet	Agent	PHASE 2	P0	COMPLETED	2h
T027	Refund processing — reverse transaction, credit wallet, email confirmation	Agent	PHASE 2	P0	TODO	1h
T028	Wallet transfer between users — validate balance, atomic transaction, both-party notifications	Agent	PHASE 2	P0	COMPLETED	1h
T029	Withdrawal request — create pending withdrawal, admin review, Paystack payout API	Agent	PHASE 2	P1	TODO	1h
T030	Transaction history endpoint — paginated, filterable by type/date/status	Agent	PHASE 2	P0	COMPLETED	1h
T031	Referral point redemption — deduct points from wallet, convert at admin-configured rate	Agent	PHASE 2	P0	COMPLETED	1h
T032	Admin config endpoint — set platform fee %, referral point value, follow-up window days	Agent	PHASE 2	P0	COMPLETED	1h
T033	NotificationsModule — EmailService via Resend (OTP, booking, payment, referral templates)	Agent	PHASE 2	P0	COMPLETED	2h
T034	Push notifications via Expo Push API — send to device token on all key events	Agent	PHASE 2	P1	TODO	1h
T035	Specialist referral to hospital — create referral, notify patient + hospital, status machine	Agent	PHASE 2	P1	COMPLETED	1h
  ▸  PHASE 3 — Expo React Native Mobile App
T036	Init Expo project in apps/mobile with TypeScript, configure Metro for monorepo	Agent	PHASE 3	P0	COMPLETED	1h
T037	Setup React Navigation: Stack + Bottom Tabs + Drawer for each user role	Agent	PHASE 3	P0	COMPLETED	1h
T038	Theme system — colors, typography, spacing tokens matching Design System doc	Agent	PHASE 3	P0	COMPLETED	1h
T039	API service layer — axios instance with JWT interceptor, refresh token rotation	Agent	PHASE 3	P0	COMPLETED	1h
T040	Auth screens — Splash, Onboarding (3 slides), Role Selection, Signup, Login, OTP, Password Reset	Agent	PHASE 3	P0	COMPLETED	2h
T041	Google Sign-In — expo-auth-session, pass token to backend /auth/google	Agent	PHASE 3	P0	COMPLETED	1h
T042	Shared components: PrimaryButton, SecondaryButton, TextInput, OTPInput, SearchInput, Card, Badge, Avatar, Skeleton	Agent	PHASE 3	P0	COMPLETED	2h
T043	Patient Home Screen — upcoming appointments, featured specialists, AI checker entry point	Agent	PHASE 3	P0	COMPLETED	1h
T044	Search Specialists Screen — filter bar, specialist cards, loading skeleton	Agent	PHASE 3	P0	COMPLETED	1h
T045	Specialist Profile Screen — bio, packages, availability, reviews, Book CTA	Agent	PHASE 3	P0	COMPLETED	1h
T046	Booking Flow — select package → select slot (calendar) → payment summary → confirm	Agent	PHASE 3	P0	COMPLETED	2h
T047	Payment Screen — points slider, wallet balance, Paystack WebView for top-up	Agent	PHASE 3	P0	COMPLETED	2h
T048	My Appointments Screen — tabs: Upcoming / In Progress / Completed / Cancelled	Agent	PHASE 3	P0	COMPLETED	1h
T049	Consultation Chat Screen — WebSocket connection, message list, input bar, media picker	Agent	PHASE 3	P0	COMPLETED	2h
T050	Wallet Screen — balance card, fund/send/withdraw sheet, transaction history list	Agent	PHASE 3	P0	COMPLETED	2h
T051	Referrals Screen — my code, share button, referred users list, points balance, leaderboard	Agent	PHASE 3	P1	COMPLETED	1h
T052	Specialist Dashboard — today schedule, earnings widget, consultation packages list	Agent	PHASE 3	P0	COMPLETED	2h
T053	Specialist Consultation Package Builder — form with pricing, follow-up count, cancellation policy	Agent	PHASE 3	P0	COMPLETED	1h
T054	Specialist Availability Setup — weekly grid slot picker with save	Agent	PHASE 3	P0	COMPLETED	1h
T055	Create Referral Screen (Specialist) — select patient, hospital, reason, urgency	Agent	PHASE 3	P1	COMPLETED	1h
T056	Donor Home — blood requests list/map, donation stats, respond to request flow	Agent	PHASE 3	P0	COMPLETED	2h
T057	My Donations Screen (Donor) — history, status tracker	Agent	PHASE 3	P0	COMPLETED	1h
T058	Hospital Dashboard — active blood requests, incoming referrals, create request CTA	Agent	PHASE 3	P0	COMPLETED	2h
T059	Notifications Screen — list all push + in-app notifications, mark read	Agent	PHASE 3	P1	COMPLETED	1h
T060	Profile & Settings Screen — edit info, change password, dark mode toggle, logout	Agent	PHASE 3	P0	COMPLETED	1h
T061	AI Symptom Checker Screen — symptom input form → API call → triage result + specialist links	Agent	PHASE 3	P1	COMPLETED	1h
T062	Deep link handling — handle Paystack redirect, email OTP links, referral code URL	Agent	PHASE 3	P1	COMPLETED	1h
T063	Offline handling — React Query cache, offline banner, retry on reconnect	Agent	PHASE 3	P2	COMPLETED	1h
  ▸  PHASE 4 — Admin Dashboard + AI Features + Chat Backend
T064	Init Next.js 14 admin in apps/admin — configure app router, Shadcn/ui, Tailwind	Agent	PHASE 4	P0	COMPLETED	1h
T065	Admin auth — JWT login, session cookie, protected routes via middleware	Agent	PHASE 4	P0	COMPLETED	1h
T066	Admin Overview Dashboard — 4 stat cards (revenue, users, consultations, donations) + sparklines	Agent	PHASE 4	P0	COMPLETED	1h
T067	Users Management Table — list/filter/search by role, actions: verify, suspend, delete	Agent	PHASE 4	P0	COMPLETED	2h
T068	Specialist KYC Queue — pending verifications, document viewer, approve/reject	Agent	PHASE 4	P0	COMPLETED	1h
T069	Consultations Table — all bookings, status filter, dispute flag, override status	Agent	PHASE 4	P1	COMPLETED	1h
T070	Financial Dashboard — platform revenue chart, pending payouts, escrow balance	Agent	PHASE 4	P1	COMPLETED	1h
T071	Platform Config Panel — fee %, referral point value, follow-up window, toggle features	Agent	PHASE 4	P0	COMPLETED	1h
T072	Blood Donation Tracker — active requests map (react-leaflet), donations by region	Agent	PHASE 4	P2	COMPLETED	1h
T073	Broadcast Notifications — compose push/email, target by role, schedule send	Agent	PHASE 4	P2	COMPLETED	1h
T074	AIModule — /ai/symptom-check endpoint using Anthropic claude-sonnet — structured response	Agent	PHASE 4	P1	COMPLETED	1h
T075	AI Smart Specialist Matching — /ai/match-specialist using symptoms + availability + ratings	Agent	PHASE 4	P1	COMPLETED	1h
T076	AI Health Coach — /ai/health-tips personalised weekly tips endpoint	Agent	PHASE 4	P2	COMPLETED	1h
T077	Multilingual AI Assistant — /ai/chat chatbot supporting English + Pidgin FAQ responses	Agent	PHASE 4	P2	COMPLETED	1h
T078	ChatModule — Socket.io gateway, room management, message persistence, typing events	Agent	PHASE 4	P0	COMPLETED	2h
T079	Chat history endpoint — paginated messages per consultationId, 90-day retention policy	Agent	PHASE 4	P0	COMPLETED	1h
  ▸  PHASE 5 — Testing, Polish, Deployment
T080	Unit tests — Jest for ConsultationService, PaymentService, ReferralService, CancellationEngine	Agent	PHASE 5	P0	COMPLETED	2h
T081	E2E tests — Supertest for auth endpoints, booking flow, payment webhook	Agent	PHASE 5	P1	COMPLETED	2h
T082	Mobile smoke test — run Expo in simulator, test all screens, fix layout issues	Agent	PHASE 5	P0	COMPLETED	1h
T083	Environment setup — .env.example with all vars, @nestjs/config validation schema	Agent	PHASE 5	P0	COMPLETED	1h
T084	Deploy NestJS API to Railway — Dockerfile, health check, production env vars	Agent	PHASE 5	P0	COMPLETED	1h
T085	Deploy PostgreSQL on Railway — connection string, migration run on deploy	Agent	PHASE 5	P0	COMPLETED	1h
T086	Deploy Redis on Railway — for OTP storage, rate limiting, session cache	Agent	PHASE 5	P0	COMPLETED	1h
T087	Deploy Admin Dashboard to Vercel — Next.js build, env vars	Agent	PHASE 5	P0	COMPLETED	1h
T088	Build Expo development client — EAS Build for iOS simulator + Android emulator	Agent	PHASE 5	P0	COMPLETED	1h
T089	Final README.md — monorepo setup guide, env vars, run commands, API docs URL	Agent	PHASE 5	P0	COMPLETED	1h
T090	Final Swagger review — ensure all endpoints documented, response codes correct	Agent	PHASE 5	P0	COMPLETED	1h

Required Environment Variables
Variable	Example Value	Description
DATABASE_URL	postgresql://user:pass@host/rubimedik	PostgreSQL connection string
REDIS_URL	redis://localhost:6379	Redis connection for OTP/cache
JWT_SECRET	your-super-secret-key-32chars	JWT signing secret
JWT_REFRESH_SECRET	your-refresh-secret-key	Refresh token signing secret
GOOGLE_CLIENT_ID	xxx.apps.googleusercontent.com	Google OAuth client ID
GOOGLE_CLIENT_SECRET	GOCSPX-xxxxx	Google OAuth client secret
PAYSTACK_SECRET_KEY	sk_live_xxxx	Paystack secret key (use sk_test for dev)
PAYSTACK_PUBLIC_KEY	pk_live_xxxx	Paystack public key
RESEND_API_KEY	re_xxxx	Resend email service API key
RESEND_FROM_EMAIL	noreply@rubimedik.com	Sender email address
ANTHROPIC_API_KEY	sk-ant-xxxx	Claude AI API key
CLOUDINARY_CLOUD_NAME	rubimedik	Cloudinary cloud name
CLOUDINARY_API_KEY	xxxxx	Cloudinary API key
CLOUDINARY_API_SECRET	xxxxx	Cloudinary API secret
PLATFORM_FEE_PERCENT	20	Platform consultation fee % (admin-configurable)
REFERRAL_POINT_VALUE	500	NGN value per referral point
FOLLOWUP_WINDOW_DAYS	30	Days allowed for follow-up consultations
ADMIN_DASHBOARD_URL	https://admin.rubimedik.com	Admin dashboard base URL
APP_URL	https://api.rubimedik.com	API base URL
EXPO_PUBLIC_API_URL	https://api.rubimedik.com	API URL for Expo app

Build Summary
Total Tasks
90 Tasks	Total Estimated
~90 Hours	Target Timeline
1 Day (24h)	Phases
5 Phases


— End of Task Tracking Document —

