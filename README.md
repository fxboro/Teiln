# Teiln — Collaborative Expense Tracker

[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Postgres-3ecf8e.svg)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-f59e0b.svg)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

> **Teiln** (German for *"to share / to split"*) is a modern, mobile-first collaborative expense tracking and debt simplification progressive web app. Designed for friends, roommates, and travel groups, Teiln streamlines shared expenses, computes minimal payment routes, and works seamlessly online and offline.

---

## 🌟 Key Features

### 🧮 1. Smart Debt Simplification & Multi-Currency Splits
- **Graph-Based Debt Optimization**: Automatically condenses complex group debts into the minimal number of direct transactions.
- **Flexible Splitting Models**: Supports Equal Splits, Exact Currency Amounts, and Custom Shares/Ratios.
- **Multi-Currency Support**: Native handling for USD ($), EUR (€), and GBP (£) with per-group base currencies.
- **Receipt Itemization**: Assign specific bill items or courses to individual diners or group members.

### 💳 2. Settlements & Real-Time Settlement Requests
- **Record Direct Payments**: Log bank transfers, cash payments, or Venmo/Revolut settlements.
- **Creditor Settlement Requests**: Creditors can request settlement directly from debtors in the group ledger.
- **Workflow State Management**: Settlement requests include `pending`, `accepted`, and `declined` states with instant chat notifications.

### 🔔 3. Browser Push & Real-Time Alerts
- **System Browser Push**: Background notifications via the Service Worker `Notification` API when new expenses or settlement requests are posted.
- **Synthetic Web Audio Chime**: Built-in modern fintech two-tone notification chime synthesized via the Web Audio API without external audio files.
- **In-App Notification Center**: Granular notification feed with unread badges, filter preferences, and manual test triggers.

### 📶 4. Offline-First PWA Support
- **Custom Service Worker (`/public/sw.js`)**: Employs *Stale-While-Revalidate* for static assets and *Network-First with Cache Fallback* for HTML navigation.
- **Full Offline Access**: View and interact with cached expense lists, group members, settlements, and balances with no internet connection.
- **Connectivity Status Banner**: Real-time online/offline indicator showing the count of cached groups and expenses.

### 🛡️ 5. Dual-Mode Authentication & Security
- **Supabase Cloud Authentication**:
  - Live PostgreSQL database integration with Row-Level Security (RLS).
  - JWT token validation directly verified with the Supabase Auth server (`/auth/v1/user`).
  - Session persistence in browser `localStorage`.
  - Passwordless Magic Links and password reset workflows.
- **Local Secure Mode (Offline / In-Memory)**:
  - Cryptographically secure SHA-256 password hashing with unique 16-byte salts using the browser's native **Web Crypto API**.
  - Strict password verification (incorrect passwords and unregistered emails are strictly rejected).
- **Frictionless Anonymous Guest Mode**:
  - Join groups instantly via shareable invite links with no sign-up required.
  - Lossless guest-to-permanent account conversion and existing account expense merging.
- **Live Diagnostics Tool**:
  - In-app token inspector and connection health monitor reporting latency, JWT payload claims (`sub`, `email`, `role`, `exp`), and storage keys.

### 💬 6. Group Chat & Emoji Reactions
- **Contextual Activity Feed**: System-generated messages whenever an expense is logged, edited, or settled.
- **Interactive Emoji Reactions**: React with emojis directly on expenses, chat messages, and settlements.

### 📊 7. Monthly Budgets & Analytics
- **Budget Tracking**: Set monthly spending limits per group with visual progress indicators and status warnings.
- **Visual Analytics**: Interactive category breakdown charts powered by Recharts.
- **Data Export**: One-click export of group ledgers to **CSV** or **JSON**.

### 🌍 8. Bilingual Localization (EN / DE)
- Native toggle between **English** and **German (Deutsch)** with instant UI reactive translation.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool & Bundler** | [Vite 8](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite` |
| **Database & Auth** | [Supabase](https://supabase.com/) (`@supabase/supabase-js` v2) / PostgreSQL |
| **Icons & UI** | [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/) |
| **Charts** | [Recharts 3](https://recharts.org/) |
| **Cryptography** | Web Crypto API (`crypto.subtle` SHA-256) |
| **Runtime / Server** | Node.js, [Express 4](https://expressjs.com/), [tsx](https://github.com/privatenumber/tsx) |
| **PWA & Offline** | Service Worker API, Cache Storage, Web App Manifest |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/teiln.git
   cd teiln
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional)**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure your Supabase credentials (if using cloud persistence):
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```
   *(Note: Teiln can also run completely out of the box in Local Secure Mode without any Supabase credentials! You can also configure credentials directly in the app UI via the Supabase modal).*

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts full-stack development server on port 3000 |
| `npm run build` | Compiles client-side TypeScript and builds Vite bundle to `dist/` |
| `npm run start` | Starts Express production server serving pre-built assets |
| `npm run lint` | Runs `tsc --noEmit` to validate all TypeScript types |
| `npm run preview` | Previews the production build locally via Vite |
| `npm run clean` | Deletes build artifacts (`dist/`, `server.js`) |

---

## 🗄️ Supabase PostgreSQL Setup & RLS Schema

If you connect Teiln to your own Supabase project, execute the following SQL DDL in your **Supabase SQL Editor** to bootstrap the tables and secure Row-Level Security (RLS) policies:

```sql
-- 1. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free',
  tier_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Groups Table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  created_by UUID NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  budget_limit NUMERIC(12, 2),
  invite_token TEXT DEFAULT substring(md5(random()::text) from 1 for 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Group Members Table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 4. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT NOT NULL DEFAULT 'dining',
  paid_by_user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  receipt_items JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Settlements Table
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Messages Table (Group Chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Authenticated Users
CREATE POLICY "Profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "View groups" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update groups" ON public.groups FOR UPDATE TO authenticated USING (true);

CREATE POLICY "View members" ON public.group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Join groups" ON public.group_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "View expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "View settlements" ON public.settlements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert settlements" ON public.settlements FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "View messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);
```

> **Supabase Redirect URL Tip**: In your Supabase Dashboard under **Authentication &rarr; URL Configuration**, add your deployed URL (and `http://localhost:3000/**`) to both **Site URL** and **Redirect URLs** to allow magic link and reset redirects.

---

## 📁 Project Structure

```text
teiln/
├── public/
│   ├── favicon.svg              # Vector brand mark & notification icon
│   ├── manifest.json            # PWA Web App Manifest
│   └── sw.js                    # PWA Service Worker (caching & push notifications)
├── src/
│   ├── components/              # Modular UI components
│   │   ├── AddExpenseModal.tsx       # Expense creation with splits & receipt breakdown
│   │   ├── AuthModal.tsx             # Sign in, registration, demo logins, magic links
│   │   ├── AuthStateIndicator.tsx    # Live auth status toast & token inspector
│   │   ├── BackgroundGraphic.tsx     # Clean topological balance vector background
│   │   ├── BottomNav.tsx             # Mobile navigation bar
│   │   ├── ConvertGuestModal.tsx     # Guest conversion & account merge modal
│   │   ├── Dashboard.tsx             # Active balances, groups list, quick actions
│   │   ├── ErrorBoundary.tsx         # Fallback error container
│   │   ├── GroupDetails.tsx          # Group expenses, balances, debt graphs & chat
│   │   ├── LandingPage.tsx           # Marketing landing view
│   │   ├── LanguageToggle.tsx        # EN/DE language switcher
│   │   ├── MonthlyBudgetDashboard.tsx# Budget progress & category analytics
│   │   ├── Navbar.tsx                # Responsive desktop header navigation
│   │   ├── NotificationCenterModal.tsx# In-app feed & notification preferences
│   │   ├── OfflineIndicator.tsx      # Connectivity banner & cached data badge
│   │   ├── SettleUpModal.tsx         # Record payments or send settlement requests
│   │   ├── SupabaseSetupModal.tsx    # Live diagnostics, SQL schema & credential settings
│   │   └── UpgradeModal.tsx          # Supporter and Pro membership plans
│   ├── context/                 # React Context Providers
│   │   ├── AuthContext.tsx           # Authentication state, login, register, guests
│   │   ├── DataContext.tsx           # Groups, expenses, balances, settlements, chat
│   │   └── LanguageContext.tsx       # Internationalization & reactive translations
│   ├── data/
│   │   └── seedData.ts               # Default groups, members, expenses & settlements
│   ├── lib/                     # Core business logic & services
│   │   ├── authSecurity.ts           # Web Crypto SHA-256 password hashing & verification
│   │   ├── debtSimplification.ts     # Graph-based minimal debt algorithm
│   │   ├── pushNotifications.ts      # Web Push API & synthetic audio chime
│   │   └── supabase.ts               # Supabase client, health checks & token verification
│   ├── types/
│   │   └── index.ts                  # Comprehensive TypeScript interfaces & domain types
│   ├── App.tsx                  # Primary view router & modal container
│   ├── index.css                # Global styles & Tailwind CSS v4 directives
│   └── main.tsx                 # Client bootstrap & service worker registration
├── .env.example                 # Environment variables template
├── metadata.json                # Project identity metadata
├── package.json                 # Project dependencies & scripts
├── server.ts                    # Full-stack Express server with Vite middleware
├── tsconfig.json                # TypeScript compiler configuration
└── vite.config.ts               # Vite configuration with Tailwind & path aliases
```

---

## 🧪 Testing Credentials (Demo Mode)

For instant evaluation when running locally without Supabase credentials:

| Name | Email | Password | Role |
|---|---|---|---|
| **Alex Rivera** | `alex@teiln.app` | `password123` | Free Tier Member |
| **Clara Vance** | `clara@teiln.app` | `password123` | Supporter Tier |
| **Sam Chen** | `sam@teiln.app` | `password123` | Free Tier Member |
| **Maya Lin** | `maya@teiln.app` | `password123` | Pro Tier |

*(You can also click **"Quick Test Accounts"** directly inside the Sign In modal to pre-fill credentials, or register any new account with an email and password of your choice).*

---

## 🔍 In-Browser Diagnostics

You can verify your authentication status or inspect active JWT tokens at any time directly in your browser's DevTools console:

```javascript
// Run the diagnostic verification utility
await window.verifySupabaseAuth();

// Test refreshing your Supabase token
await window.refreshSupabaseToken();
```

---

## 📄 License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.
