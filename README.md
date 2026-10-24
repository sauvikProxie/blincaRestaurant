# Blinca for restaurants

The restaurant-side counter app of the Blinca delivery platform. Kitchen staff use it to see live orders, accept or reject them, pause new orders, and check quick sales numbers.

Menu, opening hours, discounts and team accounts are managed in the Blinca web portal (`apps/partner` in the backend monorepo), not here.

All data comes from the Blinca Convex backend (the `Blinca backend` repo). This app doesn't change the backend: it uses the same functions as the web portal.

## Run it

Requirements: Node.js 20+, npm, and a running Blinca backend.

### 1. Start the backend

In the `Blinca backend` repo (Bun 1.4; without a global install, `npx bun@1.4.2 ...` works too):

```bash
bun install
cd packages/backend
bun run dev                              # local Convex backend on 127.0.0.1:3210 / :3211
npx convex run vatRates:seedDefaults     # once per fresh deployment
bun run seed:dev                         # demo restaurant + owner@blinca.test / password123
```

### 2. Start this app

```bash
cp .env.example .env    # URLs of the backend; the defaults match a local `convex dev`
npm install
npm run dev
```

Open http://localhost:5173 and sign in with `owner@blinca.test` / `password123`. On a local backend, **Simulate order** on Home places a paid test order (set `PUBLIC_DEV_TOOLS=false` to hide it).

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app with hot reload |
| `npm run build` | Build the static app into `build/` |
| `npm run preview` | Serve the production build |
| `npm run check` | Type-check with svelte-check |
| `npm run lint` | Run ESLint |
| `npm test` | Run the unit tests (Vitest) |
| `npm run verify` | Run check, lint and tests together |

### Native app

The web app is wrapped by Tauri 2 in `src-tauri/`. You need Rust (stable) for desktop builds, plus the Android SDK/NDK and JDK 17 for Android (see `techStack.txt`).

```bash
npm run tauri dev      # desktop window
npm run tauri build    # desktop installer
npm run tauri android dev
```

**Android and a local backend:** the emulator can't reach `127.0.0.1` on your computer. Forward the backend ports first: `adb reverse tcp:3210 tcp:3210 && adb reverse tcp:3211 tcp:3211`.

**Production backend:** set `PUBLIC_CONVEX_URL` and `PUBLIC_CONVEX_SITE_URL` before `npm run tauri build`. The HTTP plugin only allows `https://*.convex.site`, `127.0.0.1` and `localhost` (`src-tauri/capabilities/default.json`); add a custom domain there if the backend gets one.

On Android the app draws edge to edge, behind the status bar, camera cutout and navigation bar. `src-tauri/gen/android/.../MainActivity.kt` is edited by hand: it keeps the bar icons dark and passes the bar sizes to the page, which pads the header, sidebar, sheets and toasts with the `--safe-*` tokens in `src/app.css`. Keep `gen/android` in version control and don't re-run `tauri android init`, or that change is lost.

## Features

| Page | Route | Highlights |
| --- | --- | --- |
| Sign in | `/login` | Email and password (the same partner accounts as the web portal). Customer accounts are turned away. Every other page redirects here until you sign in; the session is remembered on the device |
| Home | `/` | Open / Paused / Closed card driven by the backend; switch off to pause new orders for 15, 30 or 60 min or until resumed. **Busy mode**: +10/20/30 min prep on new orders for 30 min, 1 h, 2 h or until turned off. **Auto-accept** switch (managers and owners). Live Active Orders table (new orders first) with accept deadlines and ready times. A toast announces each new order |
| Notifications | Bell in the header | Live feed from the backend (new, waiting, auto-accepted, missed and cancelled orders, items back in stock) with unread count and "Mark all as read". Tapping one opens its order. A sound rings for new orders and, if wanted, repeats every 10 s while one waits. **Alerts and printing** sets tone, volume, repeat and which kinds to show (saved per login on the backend) and auto-print (saved on the device) |
| Order detail | `?order=<id>` on any page | Live side drawer (bottom sheet on phones): customer, address, notes, items with options, amounts with VAT. New: Accept (prep time suggested from the usual time plus busy minutes) or Reject (reason, optionally marking items sold out). Preparing: Add time, Mark ready. Ready: Handed to rider / Collected by customer. **Print** a kitchen ticket (desktop builds) |
| Previous Orders | `/orders` | Managers and owners. Search by name or order number, status filter, date range (up to 92 days), Load more |
| Sales | `/sales` | Managers and owners. Today / 7 / 30 days: revenue, orders, average order, rejections, average prep time, each compared with the period before; orders per day; best sellers |
| Performance | `/performance` | Managers and owners. Today / 7 / 30 days: acceptance rate, missed and auto-accepted orders, time to accept, rejections and cancellations by reason, refunds, late share and promised vs actual prep time, open / paused / busy time, items sold out now |

Employees see Home and notifications. Every data view has a loading skeleton, an empty state and an error state with a retry button.

## Project structure

```
Assets/                    Brand files (logo, app icon, font, colours) - the single source, never copied
src/
  app.css                  Design tokens (imports Assets/04-Colour), @font-face, type scale, form styles
  lib/
    config/app.config.ts   Currency, date/time formats (Stockholm time), page sizes
    convex/
      api.ts               Typed references to the backend functions this app calls
      client.ts            The Convex connection (websocket, live queries)
      auth-http.ts         Better Auth sign-in / token / sign-out over HTTP
      errors.ts            Backend error codes to messages
    types/                 Order, restaurant status, sales and auth models
    services/
      types.ts             Service interfaces the UI depends on
      index.ts             Wires the Convex implementations
      convex/              Convex-backed auth, orders, restaurant and stats services
      storage.ts           Safe localStorage wrapper
    stores/                Svelte 5 rune stores: auth, live orders, restaurant, notifications, printer, clock, toasts, Resource
    utils/                 Pure logic + tests: restaurant-status, order-rules, notifications, print, alert-sound, stockholm-time, format, performance, auth
    components/
      ui/                  StatusBadge, StatCard, DataTable, Toggle, Modal, Drawer, Toaster, ...
      layout/              AppShell, Header, Sidebar, nav
      notifications/       Bell + panel, alerts and printing settings
      orders/ home/ performance/
  routes/                  One folder per page
src-tauri/                 Tauri shell (+ HTTP plugin for sign-in)
```

## How it works

### Connecting to Convex

- **Live data.** Order board, order details, restaurant status, notifications and the signed-in profile are Convex queries watched over one websocket (`ConvexClient.onUpdate`). Changes from this device, other devices or the backend (e.g. auto-reject) appear without polling.
- **Actions** are Convex mutations (`orders.accept`, `orders.reject`, `restaurants.pauseOrders`, ...). The backend enforces every rule: allowed transitions, prep times, permissions. The UI shows its error messages.
- **No generated API.** This app lives outside the backend monorepo, so `src/lib/convex/api.ts` mirrors the function names and shapes by hand. If a backend function changes, update it there. Moving the app into the monorepo would allow `@blinca/backend/convex/_generated/api` instead.

### Signing in without a server

The backend's web apps keep the Better Auth session in a cookie through a SvelteKit server proxy. This app has no server, so it uses what the backend's `convex()` auth plugin already supports:

1. `POST /api/auth/sign-in/email` returns the session token in its JSON body. It is stored in `localStorage`.
2. `GET /api/auth/convex/token` with `Authorization: Bearer <token>` returns a short-lived JWT, which the Convex client fetches and refreshes on its own (`setAuth`).
3. After sign-in the app checks `partnerProfiles.me`, so only active restaurant accounts get in.

The Convex site URL sends no CORS headers, so:
- **In Tauri**, auth requests go out from Rust through `@tauri-apps/plugin-http`, with the Origin header removed (`unsafe-headers` feature). Better Auth's CSRF origin check protects cookie sessions; this client never sends a cookie (the plugin's `cookies` feature is off).
- **In a plain browser** (`npm run dev` / `preview`), Vite proxies `/api/auth` to the site URL and strips cookies both ways, so it can't overwrite another localhost app's session cookie.

If the session ends (signed out elsewhere, expired), the app returns to sign-in and says why. Network failures while refreshing the token are retried, not treated as a sign-out.

### Open / Paused / Closed

`restaurantState()` in `src/lib/utils/restaurant-status.ts` is the same rule as the backend's: switched off by Blinca → closed; paused → paused; otherwise the opening hours decide. Hours are read in Stockholm time with the backend's own helpers (`stockholm-time.ts`, ported from `convex/lib/stockholmTime.ts`), including overnight ranges and special days. A shared clock ticks every 10 s, so pauses and hours flip on time.

### Busy mode, auto-accept and prep times

`src/lib/utils/order-rules.ts` mirrors the backend's `convex/lib/orderRules.ts`: busy minutes count until `busyUntil`, and a new ASAP order's prep time is `max(prep, min(prep + busy, 60))`. It is worked out against the live clock because the backend's `defaultPrepMinutes` only refreshes when the status changes, not when a busy period runs out. The accept dialog offers exactly the backend's `prepChoices()`, so a kitchen whose usual time is over 60 min also gets that choice.

### Sound

Tones are synthesised with Web Audio (`src/lib/utils/alert-sound.ts`, the same tones as the web portal), so no audio file ships. Webviews only allow audio after a user gesture: the first tap or key press anywhere unlocks it, and until then the header shows "Tap to turn on sound". Sound plays while the app is open; it can't ring from the background or with the screen off (that needs native push notifications).

### Kitchen tickets

`orders.ticket` gives what the kitchen needs and nothing more (no phone, no last name). The ticket is rendered into a print-only area (80 mm receipt layout) and printed with `window.print()`; the rest of the app is hidden on paper. Tickets print one at a time. Auto-print prints each order once when it becomes accepted, by staff or by auto-accept, on every device that has it switched on. Android and iOS webviews can't print, so the print button and setting are hidden there.

### Time and money

- Every time is shown on the restaurant's clock (Europe/Stockholm), whatever the device's time zone. Business days start at 04:00, as on the backend.
- Amounts are integers in öre and **include VAT**, exactly as the backend charged them; the drawer shows the VAT contained per rate.

## Brand implementation

- **Colours.** `src/app.css` imports `Assets/04-Colour/blinca-colours.css` and maps it to semantic tokens (`--color-action`, `--color-tint`, ...). Components only use tokens; there are no hex values in components.
- **Logo.** The header loads the logo straight from `Assets/01-Logo/SVG`: the lockup on wide screens and the mark on phones. The favicon and Tauri icons come from `Assets/02-App-Icon`.
- **Typography.** Mundial Regular is loaded from `Assets/03-Fonts`. There is one weight only and no bold anywhere; hierarchy comes from size, spacing and colour. Text is in sentence case.
- **Interface.** Buttons are pills, 52 px tall. Cards have a 16 px radius and sheets 24 px, on an 8 px spacing grid. Filter chips are Blush with a Cranberry edge when selected. Speed lines appear on the status card and empty states.
- **Contrast.** Small white text sits on Cranberry Deep, never on Cranberry. The "open" status card uses Cranberry Deep for this reason.
- **No green or blue in the palette.** The six order statuses are told apart by fill style (solid, outline or tint) plus a unique icon. Trends are Ink when good and Cranberry Deep when bad, always with an arrow.
- **Voice.** Short and warm, numbers as digits, and an apology when something fails. There are no emoji, and at most one exclamation mark.

### Font limitation (action needed before launch)

`Assets/03-Fonts/Mundial-Regular.otf` is the Fontspring **demo**. Besides covering only basic Latin, it replaces the digit **4** and most symbols (`# % & ' ( ) - + / !` and others) with "demo" placeholder glyphs.

To keep the UI readable, the `@font-face` in `src/app.css` uses `unicode-range` so Mundial only renders letters and `, . : ; ?`. Digits and symbols fall back to `system-ui`, the brand's documented fallback. Swedish letters (å ä ö) also fall back.

**Before launch:** put the licensed font in `Assets/03-Fonts` and delete the `unicode-range` line.

## Next steps

- Native push notifications, so new orders ring with the app in the background or the screen off.
- Printing from Android tablets (needs a native printer plugin or a network receipt printer).
- Keep the session token in the OS keychain instead of `localStorage`.
- An employee-level "today's numbers" query on the backend, so counter staff can see quick stats too.
- Courier status after hand-over, once the backend's courier milestone (M4) lands.
- Move the app into the backend monorepo to use the generated, always-in-sync API types.
- Licence the full Mundial font.
