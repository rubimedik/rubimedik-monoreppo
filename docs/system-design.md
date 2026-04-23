

RUBIMEDIK
Design System & Style Guide
Mobile App (Expo RN) + Admin Dashboard + API  •  v1.0


1. Design Philosophy
Rubimedik's design is built on three core pillars:

Trust & Safety

Every design decision reinforces the feeling of medical credibility and data security.	Accessibility First

Readable typography, sufficient contrast, and touch-friendly targets for all users.	Warmth + Urgency

Red communicates urgency and health; white conveys cleanliness and trust.

2. Color System
2.1 Light Mode Palette
The light mode uses clean whites and a bold red accent palette, inspired by the Rubimedik brand.

   	Primary Red
#D32F2F	Primary actions, CTAs, active states, brand identity

   	Red Light
#EF5350	Hover states, secondary actions, icon variants

   	Red Dark
#B71C1C	Pressed states, active navigation, danger confirmations

   	Background
#FFFFFF	App background, card surfaces, modal backgrounds

   	Surface Gray
#F5F5F5	Secondary surfaces, input backgrounds, divider areas

   	Light Red Tint
#FFEBEE	Alert backgrounds, selected states, tag backgrounds

   	Text Primary
#212121	Primary body text, headings, labels

   	Text Secondary
#757575	Captions, placeholders, metadata, timestamps

   	Success Green
#2E7D32	Completed states, verified badges, positive transactions

   	Warning Amber
#F57F17	Pending states, caution alerts, low balance warnings

   	Error Red
#C62828	Form errors, failed payments, destructive actions

   	Border
#E0E0E0	Card borders, input outlines, dividers

2.2 Dark Mode Palette
The dark mode draws inspiration from the existing Rubimedik website (rubimedik.com) — deep navy backgrounds with red accents.

   	Dark Background
#1A1A2E	Primary background — deep navy blue (#1A1A2E)

   	Dark Surface
#16213E	Card surfaces, bottom sheets, modal backgrounds (#16213E)

   	Dark Accent
#0F3460	Section backgrounds, nav bars, drawer (#0F3460)

   	Primary Red (Dark)
#EF5350	CTAs and accents — slightly lighter red for dark bg

   	Dark Text Primary
#FFFFFF	Primary text on dark backgrounds

   	Dark Text Secondary
#B0BEC5	Secondary text, captions on dark

   	Dark Border
#2A2A4A	Card borders, dividers on dark mode

2.3 Semantic Color Usage
Consultation — Upcoming	#1976D2 (Blue) — patient needs to attend
Consultation — In Progress	#F57F17 (Amber) — active session
Consultation — Completed	#2E7D32 (Green) — done, payment released
Consultation — Cancelled	#757575 (Gray) — inactive
Blood Request — Critical	#B71C1C (Dark Red) — urgent donation needed
Blood Request — High	#D32F2F (Red) — important
Blood Request — Normal	#EF5350 (Light Red) — standard
Wallet — Credit	#2E7D32 (Green) — money in
Wallet — Debit	#C62828 (Error Red) — money out
Referral Points	#7B1FA2 (Purple) — points currency
Verified Badge	#1976D2 (Blue) — KYC verified specialist

3. Typography
3.1 Type Scale — Mobile (React Native)
Font Family	Inter (via expo-google-fonts/inter) — Primary typeface
Font Family Alt	System default fallback: SF Pro (iOS), Roboto (Android)
Display / H1	32sp · Bold · Letter-spacing: -0.5 · Line-height: 40
H2	24sp · SemiBold · Letter-spacing: -0.25 · Line-height: 32
H3	20sp · SemiBold · Letter-spacing: 0 · Line-height: 28
H4	18sp · Medium · Letter-spacing: 0.15 · Line-height: 26
Body Large	16sp · Regular · Letter-spacing: 0.5 · Line-height: 24
Body	14sp · Regular · Letter-spacing: 0.25 · Line-height: 20
Caption	12sp · Regular · Letter-spacing: 0.4 · Line-height: 16
Label / Button	14sp · Medium · Letter-spacing: 1.25 · UPPERCASE
Code / Amounts	16sp · Mono (JetBrains Mono) · Tabular numbers

3.2 Type Scale — Admin Dashboard (Web)
Font Family	Inter (Google Fonts CDN)
H1 Page Title	2rem (32px) · 700 weight
H2 Section Header	1.5rem (24px) · 600 weight
H3 Card Header	1.125rem (18px) · 600 weight
Body	0.875rem (14px) · 400 weight · line-height: 1.5
Small / Caption	0.75rem (12px) · 400 weight
Table Cell	0.8125rem (13px) · 400 weight
Button	0.875rem · 500 weight · letter-spacing: 0.02em

4. Spacing & Grid System
4.1 Base Unit
Base unit: 4px. All spacing values are multiples of 4.
xs	4px — icon padding, tight internal spacing
sm	8px — component internal padding
md	16px — card padding, standard gap
lg	24px — section spacing
xl	32px — screen horizontal padding
2xl	48px — hero sections
3xl	64px — major section gaps

4.2 Mobile Layout Grid
•	Screen horizontal padding: 16px (left and right)
•	Card border radius: 12px (standard), 8px (compact), 20px (hero cards)
•	Bottom navigation height: 60px + safe area inset
•	Status bar: handled by expo-status-bar
•	Minimum touch target: 44x44px per Apple HIG / Material Design
•	List item height: 72px (standard), 56px (compact), 88px (with subtitle)

4.3 Admin Dashboard Grid
•	Max content width: 1440px centered
•	Sidebar width: 240px (expanded), 64px (collapsed)
•	Content padding: 24px
•	Card gap: 16px
•	Table row height: 48px

5. Component Library
5.1 Buttons

PrimaryButton
Main CTA — red fill with white text
•	Background: #D32F2F | Text: #FFFFFF | Height: 52px | Border-radius: 12px
•	Padding: 16px horizontal | Font: 14sp Medium Uppercase
•	Pressed: opacity 0.85 + scale 0.98 | Disabled: opacity 0.4
•	Loading: ActivityIndicator replaces label
•	Dark mode: Background #EF5350

SecondaryButton
Outlined button for secondary actions
•	Background: transparent | Border: 1.5px solid #D32F2F | Text: #D32F2F
•	Height: 52px | Border-radius: 12px
•	Pressed: fill with rgba(211, 47, 47, 0.08)
•	Dark mode: Border + Text #EF5350

GhostButton
Text-only for tertiary actions
•	Background: transparent | Text: #D32F2F | No border
•	Pressed: rgba(211, 47, 47, 0.08) background
•	Used in: cancel actions, 'View all' links

IconButton
Circular icon-only button
•	Size: 40x40px circle | Background: #FFEBEE
•	Icon color: #D32F2F | Pressed: scale 0.92
•	Used in: toolbar actions, floating action button

5.2 Input Fields

TextInput
Standard form input
•	Height: 52px | Background: #F5F5F5 | Border: 1px solid #E0E0E0
•	Border-radius: 10px | Padding: 12px 16px
•	Focus: border 2px #D32F2F | Error: border #C62828 + error text below
•	Label: 12sp above field | Helper text: 12sp below
•	Dark mode: Background #16213E | Border #2A2A4A | Text #FFFFFF

SearchInput
Search bar for specialist/filter search
•	Height: 48px | Left icon: search magnifier (#757575)
•	Clear button appears when text > 0
•	Background: #F5F5F5 | Border-radius: 24px (pill shape)

OTPInput
6-digit OTP entry for verification
•	6 individual cells | Cell: 48x56px | Border-radius: 8px
•	Active cell: 2px red border | Filled cell: red background white text
•	Auto-advance on digit entry | Supports paste

5.3 Cards

SpecialistCard
Specialist listing card
•	Shadow: 0 2px 8px rgba(0,0,0,0.08) | Border-radius: 16px
•	Padding: 16px | Background: #FFFFFF
•	Contents: Avatar (48px circle) | Name (H4) | Specialty tag | Rating stars | Price | 'Book Now' button
•	Verified badge: blue checkmark top-right of avatar
•	Dark mode: Background #16213E

AppointmentCard
Upcoming/past consultation card
•	Left accent bar: 4px colored by status (blue=upcoming, amber=in-progress, green=completed)
•	Contents: Date/time chip | Specialist name + avatar | Consultation type | Status badge | Action buttons
•	Swipe left for cancel action (red reveal)

WalletCard
Wallet balance display
•	Full-width gradient card: #D32F2F to #B71C1C
•	Balance: 32sp Bold White with NGN prefix
•	Points balance shown below in smaller text
•	Quick actions: Fund, Send, Withdraw (white icon buttons)

BloodRequestCard
Blood donation request card
•	Top: urgency badge (CRITICAL in dark red, HIGH in red, NORMAL in light red)
•	Blood type: 40x40px circle with type letter | Hospital name | Distance | Time posted
•	Respond CTA: full-width red button

5.4 Navigation
Bottom Tab Bar	5 tabs: Home, Consultations, Donate/Request, Wallet, Profile
Active Tab	Icon + label in #D32F2F | Indicator: 2px red line above tab
Inactive Tab	Icon + label in #BDBDBD
Tab Icons	Phosphor Icons (react-native-phosphor) — filled when active, regular when inactive
Stack Header	White bg, red title text, back arrow in red
Drawer (Admin)	240px, DARK_BG in dark mode, red active item highlight

5.5 Status Badges & Tags
Upcoming	Background #E3F2FD | Text #1976D2 | Border-radius: 6px | 10sp medium
In Progress	Background #FFF8E1 | Text #F57F17
Completed	Background #E8F5E9 | Text #2E7D32
Cancelled	Background #F5F5F5 | Text #757575
Critical	Background #FFEBEE | Text #B71C1C
Verified	Background #E3F2FD | Text #1976D2 | Checkmark icon
Points	Background #F3E5F5 | Text #7B1FA2 | Star icon prefix

5.6 Loading & Skeleton States
•	Skeleton screens: animated shimmer gradient (#E0E0E0 to #F5F5F5)
•	Shimmer direction: left to right, 1.2s duration, infinite
•	All cards and list items have skeleton versions
•	Full-screen loader: Rubimedik logo pulse animation on white background
•	Button loading: spinner replaces text, button disabled during load

5.7 Empty States
•	Illustration + heading + subtext + CTA button
•	Illustration style: flat, minimal, red/white color palette
•	Examples: No consultations booked, No messages yet, No donation history
•	CTA button: primary red button linking to relevant action

6. Iconography
Icon Library	Phosphor Icons (react-native-phosphor) — consistent across all platforms
Size XS	16px — inline icons, badges
Size SM	20px — button icons, list item icons
Size MD	24px — navigation icons, card icons
Size LG	32px — feature icons, empty states
Size XL	48px — hero illustrations, onboarding
Active Color	#D32F2F
Inactive Color	#757575
On Dark	#FFFFFF / #EF5350 for accented icons

6.1 Key Icon Mapping
Home / Dashboard	house (filled)
Consultations	stethoscope (filled)
Blood Donation	drop (filled)
Wallet	wallet (filled)
Profile	user-circle (filled)
Notifications	bell
Chat	chat-circle-dots
Calendar	calendar
Settings	gear
Verification / KYC	shield-check
Referral	users-three
Payment	credit-card
AI / Smart	sparkle
Hospital	hospital

7. Screen Inventory & Navigation Structure
7.1 Onboarding Flow
•	Splash Screen → App Icon pulse on white
•	Onboarding Carousel (3 slides) → value props for each user type
•	Role Selection Screen → Patient | Specialist | Donor | Hospital
•	Signup Screen → Email/Password + Google OAuth
•	OTP Verification → 6-digit code entry
•	Profile Setup → role-specific fields
•	Home Dashboard

7.2 Patient Screens
•	Home: Featured specialists, upcoming appointments, health tips
•	AI Symptom Checker: symptom input → AI triage → specialist recommendations
•	Search Specialists: filter by specialty, price, availability, rating
•	Specialist Profile: bio, packages, reviews, availability
•	Booking Flow: select package → select slot → payment → confirmation
•	Appointment Detail: join chat, view documents, cancel
•	Consultation Chat: real-time messaging
•	My Appointments: upcoming, completed, cancelled tabs
•	Wallet: balance card, fund/send/withdraw, transaction history
•	Referrals: my referral code, referred users, points balance
•	Notifications: all notifications list
•	Profile: personal info, settings, help, logout

7.3 Specialist Screens
•	Home: today's schedule, earnings summary, pending requests
•	Consultation Packages: list, create, edit, delete packages
•	Availability Setup: weekly calendar slot picker
•	Appointment Queue: upcoming, in-progress, completed
•	Patient Detail: patient profile during consultation
•	Consultation Chat: messaging with patient
•	Create Referral: refer patient to hospital
•	Earnings Dashboard: this month, payout history, pending
•	Wallet: balance, payout request, transaction history
•	Profile: professional profile, KYC documents, ratings

7.4 Donor Screens
•	Home: blood requests map/list, donation stats
•	Blood Requests: filterable list by blood type and urgency
•	Request Detail: hospital info, donation instructions, respond CTA
•	My Donations: history, status tracker
•	Points & Rewards: earned points, referral code
•	Profile: blood type, availability toggle, contact info

7.5 Hospital Screens
•	Dashboard: active requests, incoming referrals, donation tracker
•	Create Blood Request: blood type, quantity, urgency
•	Manage Donations: list of matched donors, confirm/verify donations
•	Referrals: incoming specialist referrals, patient details
•	Profile: hospital info, departments, contact

8. Motion & Animation Guidelines
Screen Transitions	Slide from right (push), fade (modal), slide up (bottom sheet)
Duration — Quick	150ms — button press feedback, toggle
Duration — Standard	300ms — screen transitions, card expand
Duration — Emphasis	500ms — onboarding, success states
Easing	ease-in-out for transitions, spring for interactive elements
Skeleton Shimmer	1200ms linear infinite — left to right gradient sweep
Success Animation	Lottie checkmark — 800ms green check on red circle
Loading Pulse	Rubimedik logo scale 1.0 → 1.1 → 1.0, 1000ms ease-in-out infinite
Card Press	Scale 0.97 on press, scale 1.0 on release — 150ms spring

9. Admin Dashboard Design System
9.1 Layout
•	Sidebar navigation — 240px wide with logo at top
•	Top header bar — page title, breadcrumb, notification bell, user avatar
•	Content area — responsive grid, max-width 1440px
•	Sidebar collapse to 64px icon-only mode on small screens

9.2 Admin Color Overrides
Sidebar Background	#1A1A2E (DARK_BG) — dark navy always
Sidebar Active Item	#D32F2F left border + #FFEBEE background
Sidebar Text	#FFFFFF primary, #B0BEC5 secondary
Page Background	#F5F5F5 (light) / #16213E (dark)
Data Table Header	#D32F2F background, #FFFFFF text
Table Row Hover	#FFEBEE (light) / #0F3460 (dark)
Stat Card — Revenue	Gradient: #D32F2F to #B71C1C
Stat Card — Users	Gradient: #1976D2 to #0D47A1
Stat Card — Donations	Gradient: #2E7D32 to #1B5E20
Stat Card — AI Usage	Gradient: #7B1FA2 to #4A148C

9.3 Admin Components
•	StatCard: icon + metric + % change vs last period + sparkline
•	DataTable: sortable columns, row actions, bulk select, export CSV
•	UserAvatar: initial circle with role-color border
•	StatusPill: same system as mobile but scaled to 13px
•	ConfirmModal: destructive action confirmation with 2s countdown
•	ToastNotification: top-right slide-in, 4s auto-dismiss

10. Accessibility
•	Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text (WCAG 2.1 AA)
•	Red (#D32F2F) on white = 5.74:1 — PASSES AA
•	All interactive elements: accessibilityLabel and accessibilityRole props
•	Dynamic Type support on iOS (honor system font size preferences)
•	Touch targets minimum 44x44px on all interactive elements
•	Error messages announced via accessibilityLiveRegion
•	Colour is never the only indicator of state — always paired with icon or text
•	Screen reader tested: VoiceOver (iOS), TalkBack (Android)

11. Naming Conventions & File Structure
11.1 Component Naming
React Native Components	PascalCase — SpecialistCard, BookingModal, WalletBalance
Hooks	camelCase with 'use' prefix — useConsultation, useWallet
Screens	PascalCase + 'Screen' suffix — HomeScreen, BookingScreen
Context	PascalCase + 'Context' suffix — AuthContext, WalletContext
API Services	camelCase + 'Service' suffix — consultationService, paymentService
Constants	SCREAMING_SNAKE_CASE — MAX_REFERRAL_POINTS, BASE_PLATFORM_FEE
Types/Interfaces	PascalCase + 'I' prefix for interfaces — IUser, IConsultation
Enums	PascalCase — ConsultationStatus, BloodType, UserRole

11.2 Mobile Folder Structure
apps/mobile/src/
  components/       — Shared reusable components
  screens/          — Screen components by feature
  hooks/            — Custom React hooks
  context/          — Global state contexts
  services/         — API call functions
  navigation/       — Stack/Tab navigators
  theme/            — Colors, typography, spacing tokens
  assets/           — Images, fonts, Lottie files
  utils/            — Helpers, formatters, validators



— End of Design System Document —

