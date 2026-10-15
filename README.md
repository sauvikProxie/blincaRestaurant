# Blinca for restaurants

The restaurant-side app of the Blinca delivery platform. Owners and staff use it to run live orders, set opening hours, switch dishes on and off, manage discounts and check monthly team performance.

There's no backend yet: all data comes from a mock service layer, and changes are kept in the browser's `localStorage`.

## Run it

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:5173 and sign in with phone `0987654321` and password `admin*123` (set in `mock.credentials` in the config).

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app with hot reload |
| `npm run build` | Build the static app into `build/` |
| `npm run preview` | Serve the production build |
| `npm run check` | Type-check with svelte-check |
| `npm run lint` | Run ESLint |
| `npm test` | Run the unit tests (Vitest) |
| `npm run verify` | Run check, lint and tests together |

### Native app (optional)

The web app is wrapped by Tauri 2 in `src-tauri/`, with no custom Rust commands. You need Rust (stable) for desktop builds, plus the Android SDK/NDK and JDK 17 for Android (see `techStack.txt`).

On Android the app draws edge to edge, behind the status bar, camera cutout and navigation bar. `src-tauri/gen/android/.../MainActivity.kt` is edited by hand: it keeps the bar icons dark and passes the bar sizes to the page, which pads the header, sidebar, sheets and toasts with the `--safe-*` tokens in `src/app.css`. Keep `gen/android` in version control and don't re-run `tauri android init`, or that change is lost.

```bash
npm run tauri dev      # desktop window
npm run tauri build    # desktop installer
npm run tauri android init && npm run tauri android dev
```

### Reset the demo data

The mock data is generated on first load and saved in `localStorage` under keys starting with `blinca:`. To start fresh, clear site data in the browser, or run `Object.keys(localStorage).filter(k => k.startsWith('blinca:')).forEach(k => localStorage.removeItem(k))` in the console and reload.

## Stack

SvelteKit 2 + Svelte 5 (runes), TypeScript 6, Vite 8, plain CSS with design tokens, a static SPA via `adapter-static`, and Tauri 2.

Tools added beyond `techStack.txt`:
- `date-fns` for dates
- `@lucide/svelte` for icons (2 px rounded stroke on a 24 px grid, which matches the brand icon spec)
- Vitest for tests
- ESLint

Leaflet is listed in the stack but isn't used, because none of the features need a map.

## Features

| Page | Route | Highlights |
| --- | --- | --- |
| Sign in | `/login` | Phone number and password, show/hide password, field validation; every other page redirects here until you sign in and returns you to where you were. The session is remembered on the device. Sign out sits at the bottom of the sidebar and asks first if orders are still active |
| Home | `/` | Open/Closed card with automatic status, manual override and "Return to schedule"; live Active Orders table that receives a new mock order every 60-90 s while open |
| Scheduled Hours | `/schedule` | Per-day open toggle and times, overnight hours with a "(next day)" hint, validation, "Copy to" all days / weekdays / weekend, unsaved-changes bar and leave guard |
| Previous Orders | `/orders` | Search, status filter, date range, sorting by time and amount, pagination |
| Order detail | `?order=<id>` on any page | Side drawer (bottom sheet on phones) with items, notes, the calculated amount breakdown, and Accept / Reject / Mark preparing / Mark ready for active orders |
| Team Performance | `/performance` | Month picker; delivered, cancelled, delayed, rating and hours-missed cards with trend versus last month; daily orders chart |
| Menu | `/menu` | All / Unavailable tabs with counts, grouped by category, search, instant toggle with Undo |
| Discounts | `/discounts` | Coupon-style cards for 5 offer types; Active / Scheduled / Expired / Paused filters; create, edit and delete with validation |
| What's New | `/whats-new` | Expandable step-by-step guides that link to the relevant pages |

Every data view has a loading skeleton, an empty state and an error state with a retry button. To see the error states, set `mock.failureRate` to `1` in the config.

## Project structure

```
Assets/                    Brand files (logo, app icon, font, colours) - the single source, never copied
src/
  app.css                  Design tokens (imports Assets/04-Colour), @font-face, type scale, form styles
  lib/
    config/app.config.ts   Currency, VAT, date/time formats, restaurant name, mock settings
    types/                 Order, Product, Schedule, Discount, Guide models
    services/
      types.ts             Service interfaces the UI depends on
      index.ts             Wires the mock implementations - swap for API ones here
      storage.ts           Safe localStorage wrapper
      mock/                Seeded data, latency simulation, order simulation
    stores/                Svelte 5 rune stores: clock, restaurant status, live orders, toasts, Resource
    utils/                 Pure logic + tests: restaurant-status, order-totals, schedule-validation,
                           discounts, performance, format
    components/
      ui/                  StatusBadge, StatCard, DataTable, Toggle, Tabs, Modal, Drawer, Toaster, ...
      layout/              AppShell, Header, Sidebar, nav
      orders/ home/ schedule/ menu/ discounts/ performance/ guides/
  routes/                  One folder per page
src-tauri/                 Tauri shell
```

## How it works

### Open/Closed status

`getRestaurantStatus(schedule, override, now)` in `src/lib/utils/restaurant-status.ts` is a pure function covered by unit tests.

- **Automatic by default.** The status is worked out from the schedule and the current time. A shared clock ticks every 10 s, so the status flips on time without a refresh.
- **Overnight hours.** A closing time earlier than the opening time runs past midnight. At 01:30 the restaurant is still open under the previous day's schedule, even if the new day is a closed day.
- **Manual override.** Flipping the switch starts an override that expires at the next scheduled opening or closing time. After that, the app is back in automatic mode. Flipping back to what the schedule says ends the override straight away, as does "Return to schedule".
- **Confirmation.** Closing while there are active orders asks for confirmation first.
- **Override history.** Every override is kept. Team Performance uses this history to calculate Hours Missed: closed overrides that overlap scheduled open hours.

### Money

All amounts are integers in öre.

`calculateOrderTotals` works as follows:
- subtotal = Σ quantity × unit price
- VAT = 12% × (subtotal − discount), rounded to the öre
- total = subtotal − discount + VAT + delivery fee

The order drawer always recalculates the totals from the items; it never displays stored totals. A test checks that every seeded order adds up.

### Swapping in a real backend

The UI only imports from `$lib/services`. To connect an API, implement the interfaces in `src/lib/services/types.ts` and replace the `createMock*` calls in `src/lib/services/index.ts`.

| Service | What to connect |
| --- | --- |
| `AuthService.signIn / signOut` | Auth endpoint. `signIn` must reject with `InvalidCredentialsError` for a wrong phone number or password, so the page can tell that apart from a network failure. Store a real token in `Session` |
| `OrdersService.listActive / listPast / getById / updateStatus` | Orders REST endpoints. `listPast` already takes server-style query params (search, status, dates, sort, page) |
| `OrdersService.subscribe` | Websocket or SSE for new orders and status changes. The mock version runs the order simulation |
| `ScheduleService`, `StatusService` | Opening hours and override history. Status logic stays on the client but could move to the server |
| `MenuService`, `DiscountsService` | Product availability and discount CRUD |
| `PerformanceService.getMonthlyReport` | Metrics aggregated on the server. The mock computes them from orders |

## Configuration

Everything that changes per market lives in `src/lib/config/app.config.ts`:
- Currency: `SEK`, formatted with `sv-SE`, e.g. "149,00 kr"
- VAT rate: 12%
- Date/time patterns: 24-hour clock
- Orders page size, and the delay threshold (45 min)
- Restaurant name
- Mock latency, failure rate, order simulation and the static sign-in credentials

## Brand implementation

- **Colours.** `src/app.css` imports `Assets/04-Colour/blinca-colours.css` and maps it to semantic tokens (`--color-action`, `--color-tint`, ...). Components only use tokens; there are no hex values in components.
- **Logo.** The header loads the logo straight from `Assets/01-Logo/SVG`: the lockup on wide screens and the mark on phones. The favicon and Tauri icons come from `Assets/02-App-Icon`.
- **Typography.** Mundial Regular is loaded from `Assets/03-Fonts`. There is one weight only and no bold anywhere; hierarchy comes from size, spacing and colour. Text is in sentence case, including the coupon headlines ("60% off").
- **Interface.** Buttons are pills, 52 px tall. Cards have a 16 px radius and sheets 24 px, on an 8 px spacing grid. Filter chips are Blush with a Cranberry edge when selected. Speed lines appear on the status card, empty states and coupons.
- **Contrast.**
  - Small white text sits on Cranberry Deep, never on Cranberry. The "open" status card uses Cranberry Deep for this reason.
  - Saffron always has Ink text, and is only used for offers and ratings.
- **No green or blue in the palette.**
  - The seven order statuses are told apart by fill style (solid, outline or tint) plus a unique icon.
  - Trends are Ink when good and Cranberry Deep when bad, always with an arrow.
- **Voice.** Short and warm, numbers as digits, and an apology when something fails. There are no emoji, and at most one exclamation mark.

### Font limitation (action needed before launch)

`Assets/03-Fonts/Mundial-Regular.otf` is the Fontspring **demo**. Besides covering only basic Latin, it replaces the digit **4** and most symbols (`# % & ' ( ) - + / !` and others) with "demo" placeholder glyphs.

To keep the UI readable, the `@font-face` in `src/app.css` uses `unicode-range` so Mundial only renders letters and `, . : ; ?`. Digits and symbols fall back to `system-ui`, the brand's documented fallback. Swedish letters (å ä ö) also fall back.

**Before launch:** put the licensed font in `Assets/03-Fonts` and delete the `unicode-range` line.

## Assumptions

- The market is Sweden: SEK, 12% VAT (restaurant rate) charged on the food subtotal after discounts, a flat 29 kr delivery fee, and the 24-hour clock.
- An order counts as delayed when it's delivered more than 45 minutes after it was placed.
- Hours Missed compares override history with the *current* schedule, since schedule history isn't stored.
- In the current month, performance is compared with the same days of the previous month, so a partial month isn't compared with a full one.
- "All Products" shows every dish, with unavailable ones dimmed. "Unavailable Products" shows only the switched-off dishes.
- Discount filters:
  - **Active** means live and switched on.
  - **Paused** means switched off and not expired.
  - **Scheduled** and **Expired** go by the dates.
- A Swedish Bank offer has no brand colour; the bank tag is neutral, inside the palette.
- Mock riders collect ready orders after about 3 minutes and deliver about 6 minutes later. On load, active orders older than 3 hours are tidied up.

## Next steps

- Replace the mock services with API clients and a realtime order feed.
- Replace the static sign-in with real accounts (the credentials currently ship inside the app, so they are not a security boundary), plus session expiry and multi-restaurant support (the name currently comes from config).
- Add product photos (the `image` field is ready; a placeholder shows until then).
- Store schedule history, so Hours Missed stays accurate after hours change.
- Add sound and push notifications for new orders on counter tablets.
- Add end-to-end tests (e.g. Playwright) for the main flows.
- Licence the full Mundial font.
