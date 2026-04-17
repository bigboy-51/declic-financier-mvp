# Debt Snowball Tracker

## Overview
A personal finance application for tracking debt snowball payments, expenses, and credits. Built with React, TypeScript, Tailwind CSS, and Shadcn UI components. The app is in French.

## Current State
- Frontend-only application (no backend server)
- Firebase Authentication + Realtime Database as the SOLE data store (no localStorage for financial data)
- Full real-time sync: any change saves to Firebase within 800ms; onValue listeners push updates from other devices/partners immediately
- Auth: email/password login, 30-day inactivity auto-logout, persistent sessions
- Cross-device: login on any browser → Firebase data loads before app renders

## Project Architecture
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn UI components
- **Routing**: react-router-dom v6
- **State**: React Query + local state hooks
- **Port**: 5000 (Vite dev server)

## Firebase Data Architecture

### Paths (all data under `users/[uid]/` — no separate couple paths)
```
users/[uid]/
  profile/           — userType, quiz answers, profileType, history, migrationComplete, setupXxxDone flags (incl. setupCoupleDone)
  onboarding/        — completed (bool), stepN_completed flags, lastUpdated (ISO string)
  boss_profile/     — quizCompleted, profileType, profileDescription, quizCompletedAt, quizAnswers
  boss_profile/quizEscalation/   — escalationLevel (0-3), skipCount, lastSkippedAt, userContinuedWithoutQuiz, quizCompleted
  wife_profile/     — same quiz result fields as boss_profile (independent)
  wife_profile/quizEscalation/   — same escalation structure, independent from boss
  single_profile/   — same as boss_profile for solo users
  single_profile/quizEscalation/ — same escalation structure for solo users
  finances/         — initialBalance, currentBalance, lastUpdated (mirrored from debt_snowball_data on step 1)
  couple/           — inviteCode, createdAt (generated on step 5 completion)
  debt_snowball_data — FinanceData (shared between boss/wife on same account)
  monthly_history    — MonthlyData
  rewards_data       — RewardsData
  challenges_data    — ChallengesData
  couple_messages    — Couple chat messages (both profiles see same messages)
  savings_data       — SavingsGoal[] (court/moyen/long terme goals)
```

### Data Flow
- `FirebaseDataContext` (src/context/FirebaseDataContext.tsx) — central hub
  - Sets up `onValue` listeners on mount; loading=true until ALL listeners fire once
  - Self-write grace period: 4s (prevents own writes from triggering re-renders)
  - Debounced saves: 800ms per key
- `AppContent` shows loading spinner until `FirebaseDataContext.loading = false`
- `AppMain` renders ONLY after Firebase data is fully loaded → hooks initialize with real data

### No localStorage for financial data
- ALLOWED: `darkMode`, `last-activity`, `current-month`, `grocery-sort-preference`
- FORBIDDEN: any financial/challenge/reward data in localStorage

## Directory Structure
```
src/
  components/       - UI components (Dashboard, Credits, Expenses, etc.)
  components/ui/    - Shadcn UI primitives
  hooks/            - Custom hooks (useFinanceData, use-toast, use-mobile)
  pages/            - Page components (Index, NotFound)
  types/            - TypeScript type definitions (finance.ts)
  lib/              - Utility functions
  index.css         - Global styles and CSS variables
  main.tsx          - App entry point
  App.tsx           - Root component with routing
```

## Key Features
- Dashboard with income overview and surplus calculation
- Credit tracking with monthly payment application
- Expense tracking with category organization and filtering
- Debt snowball projection
- Lock/unlock functionality for credits and expenses
- Data reset capability
- Expense categories ordered: 💰 Finances, 🏠 Logement, 🎉 Loisirs, 🚗 Transport, 👨‍⚕️ Santé, 🔄 Remboursements, 🔀 Divers
- Remboursements reduce total charges (net = gross - reimbursements)
- **6 navigation tabs**: Dashboard, Crédits, Charges, Couple/Motivation, Défis, Épargne (new)
- **3-Level Quiz Escalation System** (post-setup): For users who skipped the financial quiz during onboarding
  - Trigger: All 4 setup steps done + no profileType (quiz was skipped)
  - E1 Soft modal: "✨ Presque là!" → "Faire le quiz maintenant" or "Plus tard"
  - E2 Dashboard locked card: "🔒 Dashboard personnalisé" with skip counter (2 skips remaining → 1)
  - E3 Hard consequence modal: "⚠️ Se connaître = clé du succès" after 3rd total skip
  - E3 Persistent banner: shows every login after E3 "Oui, continuer", session-dismissible
  - Quiz result screen: Shows profile emoji + "✨ Connais-toi toi-même ✨" + "Vous avez déverrouillé votre personnalisation"
  - Settings reminder: "Complétez votre profil" badge + "Faire le quiz maintenant" button when escalation pending
  - Firebase fields: `quizEscalationSkipCount: number`, `quizEscalationDismissed: boolean`
  - Auth functions: `incrementEscalationSkip()`, `setEscalationDismissed()`
- **Progressive onboarding (SetupWizard)**: 4-step wizard that auto-appears after quiz completion
  - Step 1: Starting balance → unlocks Dashboard  
  - Step 2: Credits/Debts → unlocks Crédits tab
  - Step 3: Monthly expenses → unlocks Charges tab
  - Step 4: Savings goals → unlocks Épargne tab
  - Tabs show locked state with "Configurer maintenant" if step not completed
  - User can dismiss and return later; each locked tab reopens wizard at correct step
- **Épargne (Savings) tab**: New tab for savings goal tracking
  - 3 timeframe sections: Court terme (0-6m), Moyen terme (6-18m), Long terme (18m+)
  - Goal cards with collapsible details, edit/delete, progress bars
  - Progress bar colors: red (0-25%), orange (26-75%), green (76-100%)
  - 🎉 celebration UI when goal reached (100%)

## Recent Changes (2026-04-07)
- 8-feature update: badge fix, grocery alert, category moves, variable charges, new Couple page
  - Fixed RewardsModal crash (return type `JSX.Element | null`, null guard on totalPoints)
  - Budget food alert: blinking banner + fullscreen popup when groceryTotal ≥ 550€; grocery card turns red; popup auto-dismissed but banner persists
  - Category moves: Apple (ChatGPT) → Divers; Cantine → Logement
  - Variable date+amount tracking added for: Travaux (Logement), Entretien voiture (Transport), Loisirs famille (Loisirs)
  - New "Couple" tab (Heart icon, 5th tab) with 3 sub-tabs:
    - Messages: 6 pre-written templates + custom input + history (localStorage "couple-messages") + author toggle
    - Guide: 5 communication tips (avoid/better/why) + real-time budget context  
    - Stats: combined points/tier, challenge counts, debt progress, message count
  - couple-messages synced to Firebase (FIREBASE_KEYS + useFirebaseSync KEYS updated)
  - MonthlyReset variable reset now clears Travaux, Entretien voiture, Loisirs famille entries too

## Recent Changes (historical)
- 2026-03-03: Comprehensive challenge system
  - New "Défis" tab (4th tab in nav bar, sword icon)
  - useChallenges hook: tracks daily/weekly/monthly challenge state in localStorage
  - Resets per period: daily key (YYYY-MM-DD), weekly key (ISO week), monthly key (YYYY-MM)
  - Daily challenges (auto-detected): check-in (5pts), salaire reçu (20pts), journée sobre (10pts), budget courses (15pts)
  - Weekly challenges: paiement à temps (30pts), tréso positive (40pts), actif 5 jours (25pts), streak 7 jours (50pts)
  - Monthly challenges (event-driven): mois accompli (100pts), dettes en baisse (75pts), budget parfait (60pts), surplus maximisé (50pts)
  - Badge tiers: Débutant (0-99), Bronze (100-250), Argent (251-500), Or (501-1000), Platine (1001+)
  - Confetti animation when 3+ daily challenges completed
  - Auto-wired: marking salary → salaireRecu, apply payment → paiementTemps, close month → moisAccompli, surplus attribution → surplusMaximise
  - dynamicBalance computed in Index.tsx (shared between DashboardHero and useChallenges)
- 2026-02-22: Grocery categories and IMMO credit fix
  - GroceryExpense type simplified to 3 categories: "course", "retrait", "autres"
  - GroceryExpenseTracker rewritten with color-coded category breakdown cards (green/blue/amber)
  - Category selector buttons in add/edit form replace dropdown
  - Expenses grouped by category in list view with group headers and totals
  - Migration: old types (courses/pharmacie/docteur/vetements/loisirs/autre) auto-mapped to new categories
  - IMMO credit updated: monthlyPayment=849, remainingAmount=80840, initialAmount=80840
  - Credit migration: auto-updates IMMO from old 77991 amounts
  - All migrations persisted to localStorage on load
- 2026-02-20: Income receipt tracking
  - Added receivedDate field to Income type (string | null, ISO date format)
  - receiptDate serves as expectedDate (day of month salary is expected)
  - receivedDate tracks when salary actually arrived (null = not yet received)
  - Visual indicators: gray clock icon + "prévu le X" when pending, green check + "reçu le X" when received
  - "Marquer comme reçu" button sets receivedDate to today's ISO date
  - Month close (both DashboardHero and MonthlyReset) resets receivedDate to null
  - Inline editing still works alongside receipt tracking
- 2026-02-20: Comprehensive mobile responsiveness optimization
  - All interactive elements have 44-48px minimum touch targets (min-h-[44px]/min-h-[48px])
  - Responsive typography: text-base on mobile, md:text-sm/md:text-base for labels
  - Credits: add form inputs, CreditItem fields, confirm/cancel buttons all mobile-optimized
  - Expenses: responsive table layout (3-col mobile, 5-col desktop), separate ExpenseRow for mobile/desktop
  - Expenses: add form, grocery budget input, lock toggle all have proper touch targets
  - SurplusChargesCard: toggle button, attribution button with min-h-[48px]
  - Added data-testid attributes to all interactive elements
- 2026-02-20: Income receipt date tracking
  - Added receiptDate field to Income type (optional, day 1-31)
  - Updated useFinanceData hook: defaults JP=23, Nadia=28; updateIncome accepts partial updates
  - DashboardHero shows calendar icons with cash flow indicator (green=received, amber=upcoming)
  - Dashboard.tsx income cards now show/edit receiptDate with number input
  - Handles undefined receiptDate gracefully with "date non definie" fallback
- 2026-02-19: Surplus attribution feature
  - Implemented "Attribuer le surplus" button in SurplusChargesCard
  - Finds smallest unsettled credit (snowball method) and increases its monthlyPayment
  - Awards 50 reward points and shows toast notification
  - Success state with reset when surplus value changes
  - Division-by-zero guard for edge cases
  - SurplusChargesCard now rendered in DashboardHero with proper props
- 2026-02-19: Full dark mode implementation
  - Added .dark CSS variables in index.css for all color tokens
  - Dark mode toggle uses document.documentElement class with localStorage persistence
  - Replaced all hardcoded light-only colors with semantic tokens across all components
  - VariableExpenseCard rewritten from inline styles to Tailwind classes
  - Fixed self-importing bug in SurplusChargesCard
- 2026-02-12: Migrated from Lovable to Replit
  - Updated vite.config.ts (port 5000, allowedHosts: true, removed lovable-tagger)
  - Cleaned up index.html metadata
  - Installed npm dependencies

## Dark Mode
- Toggle: Moon/sun button in header, persisted to localStorage
- Implementation: Tailwind `darkMode: ["class"]` with `.dark` class on `<html>`
- All components use semantic CSS variable tokens (--background, --card, --foreground, etc.)
- Accent colors (amber, orange for rewards) use opacity variants that work on both themes

## Forking This Project (for testers / staging)

**Root cause of 404 on a fork**: The static deployment serves `dist/`. A fresh fork has no `dist/` folder — `npm run build` was never run there. Publishing before building = 404.

**Step-by-step to get a fork live:**
1. Open the Shell in the fork
2. Run `npm install` (installs dependencies)
3. Run `npm run build` (creates `dist/`)
4. Wait for `✓ built in Xs` — then click Deploy → Publish

**Firebase credentials**: NOT stored as Replit Secrets — they live in `.replit` under `[userenv.shared]`. This section is copied automatically when forking, so no manual secret setup is needed in the fork.

**Data isolation**: All forks connect to the **same Firebase project**. Each tester creates a new account (new UID) → their data is fully isolated from other users. No extra Firebase config needed.

**What does NOT carry over to a fork:**
- The compiled `dist/` folder (must rebuild)
- Any Replit Secrets added manually (but those aren't used here — see above)
- `localStorage` data from the original browser session (irrelevant for new testers)

## User Preferences
- App language: French
