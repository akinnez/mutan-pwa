# MUTAN Cooperative — Member Portal (PWA)

Mobile-first Progressive Web App for MUTAN cooperative members.

## Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS (mobile-first, Forest Green theme)
- **State:** Zustand + TanStack Query
- **HTTP:** Axios with auto token refresh
- **PWA:** Web manifest + service worker ready

---

## Quick Start

```bash
npm install
cp .env.local .env.local   # already configured
npm run dev
```

App runs at **http://localhost:3001**

Set `NEXT_PUBLIC_API_URL` to point to your backend.

---

## Pages

| Route | Description |
|-------|-------------|
| `/onboarding` | Multi-step auth: verify identity → OTP → setup credentials or login |
| `/dashboard` | Home — total balance, wallet cards, quick actions, recent transactions |
| `/savings` | Wallets tab, transactions tab, browse & join/manage schemes |
| `/loans` | Active loan with repayment progress, loan history |
| `/investments` | Available rounds with eligibility criteria, my investment portfolio |
| `/shares` | Share holdings, transaction history |
| `/payments` | Declare manual bank payments with receipt upload |
| `/profile` | Member details, SMS opt-in, change password, change PIN, logout |

---

## Onboarding Flow

```
1. Verify identity   → phone + staff_id OR mutan_id
2. Request OTP       → SMS via Termii (rate limited 5/hr)
3. Confirm OTP       → receive setup_token
4a. First time?      → Set password + 4-digit PIN
4b. Returning?       → Enter password → login
```

Forgot password: separate OTP flow with PASSWORD_RESET purpose.
PIN reset: authenticated OTP flow from Profile page.

---

## Design

- Mobile-first max-width 448px container
- Forest Green (`#0F5132`) primary
- Warm Gold (`#D4AF37`) accent
- Bottom navigation with 5 tabs
- Bottom sheets for all modals (mobile-native feel)
- PWA manifest for "Add to Home Screen"

---

## PWA Setup

For full offline support, add a service worker.
The manifest is at `/public/manifest.json`.
Replace `/public/icon-192.png` and `/public/icon-512.png` with actual MUTAN icons.
