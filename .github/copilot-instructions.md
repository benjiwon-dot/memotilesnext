# Memotile Next.js Codebase - AI Copilot Instructions

## Project Overview
**Memotile** is a photo-to-physical-product e-commerce platform (Next.js 16, React 19, TypeScript, Tailwind CSS, Firebase). Users upload photos, design custom tiles, and checkout via Stripe or Toss Payments. Bilingual (Thai/English) with multi-language translation system.

## Architecture & Key Patterns

### 1. Client-Server Boundary & Auth Pattern
- **No middleware route protection**: `middleware.ts` is disabled (empty matcher). All route protection happens client-side via `AuthGate` wrapper component.
- **Firebase Auth only** (no session cookies): Client stores auth state in `AppContext`. Use `useApp()` hook to access `user`, `authLoading`.
- **AuthGate usage**: Wrap protected page content with `<AuthGate requireVerified={true/false}>` in client components (marked `"use client"`).
- **Key file**: [context/AppContext.tsx](context/AppContext.tsx) - manages auth, user, email verification, language, and shopping cart state.

### 2. Global State Management (AppContext)
Located in [context/AppContext.tsx](context/AppContext.tsx) - provides:
- **Auth methods**: `loginWithGoogle()`, `loginWithEmail()`, `registerWithEmail()`, `logout()`
- **Email verification**: `resendVerificationEmail()`, `requireEmailVerified(user)` helper
- **Cart operations**: `cart`, `upsertCartItem()`, `removeCartItem()`, `clearCart()` - stored in localStorage with Firebase user ID
- **Language/i18n**: `language` state, `setLanguage()`, `t()` translation function
- **Usage**: `const { user, authLoading, cart, t } = useApp();` in any client component

### 3. Page Structure - Server vs Client Components
- **Server pages**: `app/*/page.tsx` - typically minimal, just render client component (e.g., `<LoginClient />`)
- **Client components**: `app/*/[Name]Client.tsx` - marked `"use client"`, use hooks like `useApp()`, `useRouter()`, handle side effects
- **Pattern**: Server page imports and renders corresponding client component to separate server/client logic cleanly

### 4. External Services Integration
- **Firebase**: Auth (Google OAuth + email/password), Firestore (orders), Cloud Storage (photo uploads)
  - Config: [lib/firebase.ts](lib/firebase.ts) - reads `NEXT_PUBLIC_*` env vars
  - Import: `import { auth, db, storage } from "@/lib/firebase";`
- **Stripe**: Payment processing (via npm packages `@stripe/react-stripe-js`, `@stripe/stripe-js`, `stripe`)
- **Toss Payments**: Korean payment gateway - script loaded dynamically in [app/checkout/CheckoutClient.tsx](app/checkout/CheckoutClient.tsx)
- **Image conversion**: `heic2any` for HEIC → JPEG conversion; `jszip` for ZIP creation

### 5. Routing & Navigation Patterns
- **Dynamic routes**: `app/myorder/[id]/page.tsx` for order details
- **Query params for redirects**: After login, capture `next` param and `verify` flag: `?next=/editor&verify=1`
- **Use `useRouter` from `next/navigation`** (not `next/router`)
- **`usePathname()` + `useSearchParams()`** for current location context in AuthGate

### 6. Data Models & LocalStorage Patterns
- **Orders**: Created in localStorage (key: `memotiles_orders`), also mirrored to Firestore
  - Order ID format: `ORD-{timestamp}-{random}` (uppercase)
  - See [utils/orders.ts](utils/orders.ts) for `CreateOrderPayload` type
  - Cart items in session/localStorage with `MYTILE_ORDER_ITEMS` key
- **Cart**: Stored in localStorage per user (key: `MEMOTILES_CART_V1:{uid}` or `MEMOTILES_CART_V1:guest`)
  - Type: `CartItem[]` - each has `id`, `previewUrl`, `src`, `qty`, `crop`
  - Synced with Firestore when user authenticates

### 7. Internationalization (i18n)
- **Language state**: Stored in localStorage (`MEMOTILES_LANG`, default `"TH"`)
- **Translation function**: `t(key)` from AppContext returns translated string or key if not found
- **Type safety**: `TranslationKey` type exported from [utils/translations.ts](utils/translations.ts)
- **Supported locales**: `"TH"` | `"EN"`
- **Usage**: Wrap all UI text in `t("translationKey")` calls

### 8. Error Handling & User Feedback
- **Firebase errors**: Catch and map to user-friendly messages (see `userFriendlyCheckoutError()` in CheckoutClient)
  - Storage CORS/auth errors → specific guidance
  - Auth errors → map error codes (user-not-found, wrong-password, etc.) to translated messages
- **Validation**: Parse/sanitize JSON from localStorage before use (`safeJsonParse`, `sanitizeCartArray`)
- **Loading states**: Use `authLoading` flag and component-level loading states before rendering sensitive UI

## Development Workflow

### Setup & Running
```bash
npm install
npm run dev           # Start dev server (http://localhost:3000)
npm run build         # Build for production
npm run lint          # Run ESLint (Next.js core + TypeScript config)
npm start             # Run production build
```

### Environment Variables (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### ESLint Configuration
- Uses Next.js ESLint config (core-web-vitals + TypeScript)
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
- Run: `npm run lint`

### Path Aliases
- `@/*` maps to project root (e.g., `@/lib/firebase` → `./lib/firebase.ts`)

## Code Conventions & Patterns

### TypeScript & Strict Mode
- `strict: true` in tsconfig - enforce non-null, type safety
- Use explicit types for context values, component props, API responses
- Avoid `any` unless unavoidable; use `unknown` + type guards

### Component File Naming
- Server pages: `app/[feature]/page.tsx`
- Client components: `app/[feature]/[Feature]Client.tsx` (PascalCase)
- Reusable UI: `components/[Component].tsx` or `components/[Component].jsx`
- Legacy code (deprecated): `__legacy__DO_NOT_USE/` folder - avoid importing

### Safe JSON Parsing Pattern
All localStorage/session data uses `safeJsonParse<T>()` helper:
```typescript
function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
```
**Always** apply this when reading from localStorage or session storage.

### Firestore Operations
- Use `setDoc()` with `serverTimestamp()` for creation timestamps
- **Strip `undefined` fields** before writing (use `stripUndefinedDeep()` helper in orders.ts)
- User documents stored under authenticated user context (auth.currentUser.uid)

### Payment Flow
1. User creates order (status: `payment_pending`)
2. Payment provider script (Stripe/Toss) returns result
3. Update order status: `paid` | `failed` | `cancelled`
4. Webhook confirms and stores `paymentIntentId`

### Component Composition
- Prefer composition over prop drilling - use AppContext for global state
- Client components use React hooks: `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`
- Memoize expensive computations with `useMemo()` for list rendering

## File Structure Reference
- `app/` - Next.js App Router pages & layouts
- `components/` - Shared UI components (AppLayout, Navbar, AuthGate, etc.)
- `context/` - AppContext provider and global state
- `lib/` - Firebase initialization, auth utilities
- `utils/` - Helpers (orders, translations, storage uploads)
- `public/` - Static assets (images, icons)
- `__legacy__DO_NOT_USE/` - Deprecated code; do not use for new features

## Common Tasks & Examples

### Adding a Protected Page
1. Create `app/feature/[Feature]Client.tsx` with `"use client"` directive
2. Wrap content in `<AuthGate requireVerified={true}>`
3. Create `app/feature/page.tsx` server component that renders `<[Feature]Client />`
4. Access user/cart via `const { user, cart } = useApp();`

### Accessing Translations
```typescript
const { t } = useApp();
const message = t("loginWrongPassword"); // Falls back to key if not found
```

### Storing/Retrieving Cart
```typescript
const { cart, upsertCartItem, removeCartItem } = useApp();
upsertCartItem({ id: "photo-1", previewUrl: "...", qty: 2 });
removeCartItem("photo-1");
```

### Firebase Upload
- See [utils/storageUpload.ts](utils/storageUpload.ts) for helper patterns
- Always wrap in try-catch; provide user-friendly error messages

---

**Last Updated**: Jan 2026 | **Maintainer**: Development Team
