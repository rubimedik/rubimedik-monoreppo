

RUBIMEDIK
Health Platform
Product Requirements Document  •  v1.0
Document Type
PRD	Version
1.0	Date
April 2025	Status
APPROVED


1. Executive Summary
Rubimedik is a comprehensive digital health platform connecting patients, medical specialists, blood donors, and hospitals within a unified ecosystem. The platform enables teleconsultation, blood donation coordination, intelligent referrals, and health-financing through an integrated wallet and rewards system.

Dimension	Details
Platform Name	Rubimedik
Platform Type	Monorepo — NestJS REST API + Expo React Native App + Admin Dashboard
Primary Markets	Nigeria (initial), West Africa (expansion)
Monetization	20% platform fee on all consultations + wallet float
Payment Gateway	Paystack
Email Service	Resend
Authentication	JWT + Google OAuth 2.0
AI Features	Symptom Checker, Smart Triage, AI Health Coach (see Section 9)

2. User Roles & Personas
2.1 Patient
Patients are the primary consumers of the platform. They seek medical consultations, track their health history, and can donate feedback to the community.
•	Search for and book specialist consultations
•	Pay for consultations via wallet, referral points, or direct card payment
•	Receive follow-up consultations without additional payment
•	Leave feedback/ratings after donation events
•	View transaction history and manage wallet balance
•	Use AI symptom checker before booking
•	Engage in in-app chat with specialists

2.2 Specialist (Doctor / Medical Professional)
Specialists are verified healthcare professionals who offer teleconsultation services and can refer patients to hospitals.
•	Create and manage a professional profile
•	Set consultation pricing, duration, and inclusions
•	Define consultation packages (e.g., initial + 2 follow-ups)
•	Accept, reschedule, or cancel appointments
•	Initiate referrals to hospitals
•	Leave feedback on blood donation events
•	Receive earnings minus platform 20% fee into wallet
•	Chat with patients via in-app messaging

2.3 Blood Donor
Blood donors register on the platform to donate blood to hospitals. They receive acknowledgments and referral points.
•	Register with blood type, availability, and location
•	Respond to blood requests from hospitals
•	Earn referral points for completed donations
•	View donation history

2.4 Hospital
Hospitals are institutional users that receive blood donations and patient referrals from specialists.
•	Post blood donation requests specifying type and urgency
•	Receive and manage patient referrals from specialists
•	View donor history and manage incoming donations
•	Dashboard for hospital administrators

2.5 Platform Admin
Admin users manage the platform configuration, user verification, disputes, and financial settings.
•	Manage all user accounts and verification
•	Set platform fee percentage (default 20%)
•	Configure referral point value (default 1 point = NGN 500)
•	View platform-wide analytics and revenue
•	Handle dispute resolution and refunds
•	Manage notification templates and broadcast messages

3. Functional Requirements
3.1 Authentication & Onboarding
Feature	Description	Priority
Email Signup	Register with email, password, role selection	P0
Google OAuth	Sign in with Google, role assignment on first login	P0
JWT Auth	Access + refresh token pair with 15min/7day expiry	P0
Email Verification	OTP via Resend email on signup	P0
Role-based Access	Separate onboarding flows per role	P0
KYC for Specialists	Document upload for professional verification	P1
Password Reset	Email OTP-based password recovery	P0

3.2 Specialist Consultation System
3.2.1 Consultation Setup (Specialist)
•	Consultation title, description, and specialty tags
•	Pricing per session (in NGN)
•	Session duration (e.g., 30 min, 60 min)
•	Number of included follow-ups (0 to N, default 0)
•	Availability calendar — days of week and time slots
•	Languages spoken
•	Cancellation policy selection (24h, 48h, no refund)

3.2.2 Consultation Booking (Patient)
•	Search specialists by specialty, availability, price range, rating
•	View specialist profile with all consultation packages
•	Select time slot and confirm booking
•	Payment: wallet balance + referral points (hybrid allowed)
•	Booking confirmation via push notification and email
•	Appointment detail page with join link (video/chat)

3.2.3 Follow-up Consultation Flow
Follow-ups are additional sessions within the same consultation package — no new payment required.
•	Specialist sets the number of allowed follow-ups at package creation time
•	After initial consultation is marked COMPLETED, system unlocks follow-up slots
•	Patient can book follow-up via the same appointment thread
•	Follow-up count tracked against the package allowance
•	Once all follow-ups are used, patient must create a new booking
•	Follow-up window: 30 days from initial consultation (configurable by admin)

3.2.4 Cancellation & Refund Policy
Scenario	Refund to Patient	Payout to Specialist	Platform Fee
Patient cancels > 48h before	100% refund	None	None
Patient cancels 24–48h before	50% refund	50% minus 20% fee	20% of 50%
Patient cancels < 24h before	No refund	80% of fee	20% of fee
Specialist cancels any time	100% refund	None + flag on profile	None
No-show by patient	No refund	80% of fee	20% of fee
No-show by specialist	100% refund + penalty point	None	None
Consultation disputed	Held in escrow, admin decides	Held in escrow	Deducted after decision
All refunds are credited back to the original payment source (wallet/points). Platform fee is only charged on successfully completed consultations and no-show-by-patient scenarios.

3.3 Wallet & Payments
3.3.1 Wallet Features
•	Fund wallet via Paystack (card, bank transfer, USSD)
•	View real-time balance
•	Transfer funds to other Rubimedik users
•	Withdraw to bank account (processed within 24h)
•	Full transaction history with filters (date, type, status)
•	Transaction types: CREDIT, DEBIT, TRANSFER_IN, TRANSFER_OUT, REFUND, PLATFORM_FEE, CONSULTATION_PAYMENT, REFERRAL_REDEMPTION

3.3.2 Referral & Points System
•	Each user gets a unique referral code on signup
•	When a referred user completes their first paid consultation, referrer earns 1 point
•	1 point = NGN 500 (value dynamically set by admin)
•	Points displayed on dashboard and in wallet section
•	Points used as partial or full payment for consultations
•	Points + wallet balance can be combined: points deducted first, wallet covers remainder
•	Points have no expiry (configurable by admin)
•	Referral leaderboard visible to users

3.3.3 Payment Flow — Consultation
1.	Patient initiates booking, system calculates total fee
2.	System checks available referral points; patient selects how many to redeem
3.	Remaining balance deducted from wallet; if insufficient, Paystack checkout triggered
4.	Payment held in escrow until consultation is COMPLETED
5.	On completion: platform takes 20%, remaining 80% credited to specialist wallet
6.	Email notification to both parties via Resend

3.4 Blood Donation Module
•	Hospitals post blood requests (blood type, quantity, urgency level: CRITICAL / HIGH / NORMAL)
•	Donors receive push notifications for matching blood type requests
•	Donor accepts request and is matched to hospital
•	Donation status: PENDING → CONFIRMED → DONATED → VERIFIED
•	Hospital verifies donation completion
•	Both patient/donor and specialist can leave feedback on donation events
•	Donation history available on donor and hospital dashboards

3.5 Specialist Referrals to Hospitals
•	Specialist creates referral for a patient after/during consultation
•	Referral includes: patient info, reason, urgency, preferred hospital
•	Patient notified and must accept/decline referral
•	On acceptance, hospital is notified with full referral details
•	Referral status: CREATED → SENT → ACCEPTED → COMPLETED / DECLINED
•	Referral history visible to specialist and patient

3.6 In-App Chat
•	Real-time messaging between patient and specialist (post-booking only)
•	Message types: TEXT, IMAGE, DOCUMENT, VOICE_NOTE
•	Chat only active while consultation is UPCOMING or IN_PROGRESS
•	Chat history preserved for 90 days post-consultation
•	Typing indicators and read receipts
•	Push notification for new messages
•	Admin can view flagged chats for moderation

3.7 Notifications
Event	Channel	Recipient
Booking confirmed	Push + Email	Patient, Specialist
Consultation starting in 1h	Push	Patient, Specialist
Consultation completed	Push + Email	Patient, Specialist
Payment received	Push + Email	Specialist
Refund processed	Push + Email	Patient
Blood request matching type	Push	Donor
Referral received	Push + Email	Hospital, Patient
New chat message	Push	Recipient
Wallet funded	Push + Email	User
Referral point earned	Push	Referrer
Account verified	Email	Specialist, Hospital

4. AI-Powered Features (Unique Differentiators)
The following AI features are recommended to make Rubimedik unique in the African health market:

AI Feature	Description	Impact
AI Symptom Checker	Before booking, patient inputs symptoms. AI (Claude/GPT) returns possible conditions, recommended specialist type, and urgency level. NOT a diagnosis.	Reduces wrong bookings by 40%
Smart Specialist Matching	AI ranks specialists for patient based on symptom input, past booking history, ratings, and availability	Improves booking conversion
AI Health Coach	Personalised weekly health tips, medication reminders, and post-consultation summaries generated by AI	Increases daily active users
Auto Consultation Notes	During consultation, AI listens (with consent) and generates structured SOAP notes for the specialist	Saves specialist 10 min/session
Blood Demand Forecasting	ML model predicts blood type shortages based on historical demand per region — alerts hospitals proactively	Saves lives via proactive action
AI Fraud Detection	Detects suspicious wallet transactions, fake bookings, and rating manipulation	Protects platform revenue
Multilingual AI Assistant	In-app chatbot that answers health FAQs in English, Pidgin, Yoruba, Hausa, Igbo using LLM	Increases accessibility

Implementation Note: AI features use Anthropic Claude API (claude-sonnet-4-20250514) for NLP tasks and symptom analysis. Blood forecasting uses a lightweight Python ML model served via a dedicated microservice endpoint.

5. Technical Architecture Overview
5.1 Monorepo Structure
apps/api	NestJS REST API — all backend logic, business rules, Paystack, Resend
apps/mobile	Expo React Native — iOS & Android patient/specialist/donor/hospital app
apps/admin	Next.js / React admin dashboard — platform management
packages/shared	Shared TypeScript types, DTOs, utilities, constants
packages/ui	Shared UI component library (mobile-focused)

5.2 Backend — NestJS Modules
Module	Responsibilities	Key Endpoints
AuthModule	Signup, login, Google OAuth, JWT, refresh tokens	POST /auth/signup, /auth/login, /auth/google, /auth/refresh
UsersModule	CRUD for all user types, profile management, KYC	GET/PUT /users/:id, /users/specialists
ConsultationModule	Packages, booking, scheduling, follow-ups, status	POST /consultations, GET /consultations/:id, PUT /consultations/:id/status
PaymentsModule	Paystack webhooks, wallet ops, escrow, payouts	POST /payments/initiate, /payments/webhook, GET /wallet/balance
DonationModule	Blood requests, donor matching, status tracking	POST /donations/request, PUT /donations/:id/respond
ReferralModule	User referrals, points, redemption, leaderboard	GET /referrals/code, POST /referrals/redeem, GET /referrals/leaderboard
ChatModule	WebSocket-based real-time messaging	WS /chat, GET /chat/:consultationId/history
NotificationsModule	Push (Expo), email (Resend), in-app	POST /notifications/send
AIModule	Symptom checker, smart matching, health coach	POST /ai/symptom-check, POST /ai/match-specialist
AdminModule	Platform config, analytics, user management	GET /admin/stats, PUT /admin/config
HospitalsModule	Hospital profile, donation intake, referral receipt	POST /hospitals/blood-request, GET /hospitals/referrals

5.3 Database Schema — Key Entities
•	User (id, email, role: PATIENT|SPECIALIST|DONOR|HOSPITAL|ADMIN, profileId, walletId, referralCode, googleId)
•	Consultation (id, specialistId, patientId, status, totalFee, platformFee, specialistPayout, followUpCount, followUpUsed, followUpWindowDays, cancellationPolicy)
•	Appointment (id, consultationId, scheduledAt, type: INITIAL|FOLLOWUP, status: UPCOMING|IN_PROGRESS|COMPLETED|CANCELLED|NO_SHOW)
•	Wallet (id, userId, balance, points, ledger: Transaction[])
•	Transaction (id, walletId, type, amount, reference, status, metadata)
•	BloodRequest (id, hospitalId, bloodType, quantity, urgency, status)
•	DonationMatch (id, requestId, donorId, status, donatedAt, verifiedAt)
•	Referral (id, specialistId, patientId, hospitalId, reason, urgency, status)
•	Message (id, chatRoomId, senderId, content, type, readAt)
•	SpecialistProfile (id, userId, specialty, licenseNumber, consultationPackages: Package[], availabilitySlots)

5.4 Swagger API Documentation
•	All endpoints documented with Swagger via @nestjs/swagger
•	Accessible at /api/docs in development and staging
•	Request/response DTOs fully typed and described
•	Auth bearer token configuration in Swagger UI
•	Grouped by module tag for easy navigation
•	Changelog section on Swagger landing page

6. Non-Functional Requirements
Category	Requirement
Performance	API response < 300ms p95; Mobile app cold start < 3s
Scalability	Stateless API deployable on Railway/Render with horizontal scaling
Security	HTTPS enforced, Helmet.js, rate limiting, Paystack webhook signature verification
Availability	99.5% uptime SLA; health check endpoint /health
Data Privacy	NDPA (Nigeria) compliance; personal data encrypted at rest
Accessibility	WCAG 2.1 AA for admin dashboard; font sizes ≥ 16sp on mobile
Offline Support	Mobile app shows cached data when offline with sync on reconnect
Internationalisation	English (primary), Pidgin Nigerian, Yoruba, Hausa, Igbo (AI assistant)

7. Admin Dashboard Features
•	Overview analytics: total consultations, revenue, active users, blood donations, referrals
•	User management: list, filter, verify, suspend, delete users by role
•	Specialist KYC queue: review uploaded documents and approve/reject
•	Consultation management: view all bookings, override status, handle disputes
•	Financial overview: platform earnings, pending payouts, escrow balance
•	Wallet management: manual credit/debit for support cases
•	Configuration panel: platform fee %, referral point value, follow-up window days
•	Notification centre: broadcast push/email to user segments
•	Blood donation tracker: active requests, donations by region
•	Referral analytics: top referrers, conversion rate, total points outstanding
•	AI usage metrics: symptom checker requests, AI feature engagement

8. Third-Party Integrations
Service	Purpose	SDK/Method
Paystack	Payment processing, wallet funding, payouts	Node.js Paystack SDK + Webhooks
Resend	Transactional email (OTP, booking, receipts)	Resend Node SDK
Google OAuth	Social login	Passport.js Google Strategy
Expo Push Notifications	Mobile push alerts	expo-notifications + Expo Push API
Anthropic Claude API	AI symptom checker, health coach, multilingual bot	Anthropic SDK
Firebase / Ably	WebSocket real-time chat	Ably Realtime or Socket.io
Cloudinary / S3	Profile photos, KYC documents, chat media	Cloudinary Node SDK
Google Calendar API	Specialist availability sync (optional v2)	Google APIs Node Client

9. Success Metrics & KPIs
Metric	Target (Month 3)	Target (Month 12)
Registered Users	5,000	50,000
Monthly Active Users	1,500	20,000
Consultations Completed	500/month	8,000/month
Platform Revenue (20% fee)	NGN 500,000/month	NGN 8,000,000/month
Blood Donations Facilitated	100/month	1,000/month
Referral Conversion Rate	15%	25%
AI Symptom Checker Usage	30% of new bookings	60% of new bookings
App Store Rating	4.2+	4.5+
Specialist Satisfaction Score	75 NPS	85 NPS

10. Out of Scope (v1.0)
•	Live video consultation (v2 — requires WebRTC or third-party like Daily.co)
•	Pharmacy integration / e-prescription
•	Insurance claims processing
•	Lab test booking and result delivery
•	Multi-language app UI (English only for v1)
•	In-app voice/video calling (chat text only for v1)

11. Document Sign-off
Role	Name	Date	Signature
Product Owner		April 2025	
Tech Lead		April 2025	
Design Lead		April 2025	
QA Lead		April 2025	


— End of Document —

