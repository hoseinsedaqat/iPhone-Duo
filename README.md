# Unofficial iPhone Duo Web Simulator Concept

یک شبیه‌ساز تعاملی و مستقل در مرورگر، با رابطی الهام‌گرفته از iPhone Duo و iOS 27. **این پروژه محصول اپل نیست، به اپل وابسته نیست و iOS یا موتور واقعی Safari را اجرا نمی‌کند.**

An independent, interactive browser concept—not an Apple product, an iOS emulator, or the real Safari engine. The application has no backend and does not sign in to Apple services.

## اجرا / Getting started

Requirements: Node.js 20+ and npm.

```bash
npm ci
npm run dev
```

Open the address printed by Vite. For a production build and local preview:

```bash
npm run build
npm run preview
```

The dev and preview servers bind to `0.0.0.0` and allow preview hosts so the app works behind a remote development proxy. Do not expose the development server to untrusted networks.

## استفاده / How to explore

- The simulator starts on the Home Screen so the apps are immediately discoverable. Use **Lock screen** below the device to see the lock screen; click the unlock hint or swipe up. The clock and date use the browser's current time.
- Use **Device controls** outside the frame for open, closed, partially folded, tabletop, portrait, and landscape. The panel can be hidden. The outer display is modeled around the announced 5.4-inch class and the inner around 7.6 inches; browser pixels and the folding poses are visual approximations, not calibrated hardware dimensions.
- Click an icon to open an app. Click the bottom home indicator to return Home. On Home, click the indicator for recent apps. Drag icons to reorder them, or press and hold/right-click for a menu. Dock icons can be reordered within the Dock. The order is saved.
- In an app, choose its **•••** multitasking menu and **Open in Split View**, then select another app—including a second Safari window. Swap, resize, close either window, or save the pair. The resize range is intentionally limited so the central reserved hinge area remains clear. Closing the device collapses the view; reopening restores the pair.
- The Today View widget menu controls the weather, calendar, and photo widgets. Calendar events for today are reflected in the widget. In Settings, switch language to فارسی for an RTL interface and Persian calendar. Most core system labels and major controls are translated; some demo copy and user/sample data remain in English.
- **Reset simulator** asks for confirmation, then removes this origin's simulator settings, notes, events, browser data, transactions, and captured photos. The static offline cache is not personal data and is not removed. Reset recreates the initial sample data; use Accounting → Transactions → **Clear all transactions** to start with an empty ledger instead.

## Apps and persistence

- **Settings** affects the simulator's theme, wallpaper, brightness overlay, text size, selected accessibility options, notifications/badges, sound feedback, language, and simulated connectivity. The network, Bluetooth, cellular and battery indicators are examples and do not control or report real hardware. Always-On is a browser visual effect.
- **Safari** has independent windows, tabs, history, bookmarks, back/forward, an editable favorites list, and offline demo pages/search. Search-engine selection labels the simulated search; it does not silently send a query to an external service. HTTP(S) sites can be previewed only where the site permits embedding. The iframe is sandboxed with scripts disabled; many sites will be blank or refuse embedding. Because browsers do not reliably reveal why an iframe failed, the app always provides an explanation and an **Open in browser** link rather than claiming a successful embed.
- **Accounting** supports transaction creation, editing, deletion, date/type/category filters and search; categories and multiple sample accounts can be added, renamed and removed when not in use. Amounts are validated decimal strings stored as integer USD cents, with totals calculated using `BigInt`; no binary floating-point arithmetic is used for ledger totals. This is sample bookkeeping software, not financial advice or a bank connection.
- **Calculator**, **Calendar**, **Clock**, **Notes**, **Photos**, **Files**, **Weather**, **App Store**, and **Camera** provide lightweight interactive experiences. Weather, maps, files, messages, phone, wallet, and App Store data are clearly simulated. Messages are not sent; phone calls, payments, native app installation and music playback are not provided.
- The Camera requests explicit browser permission before using `getUserMedia`; photos captured in the simulator are saved locally. Availability depends on a secure context, a camera, browser support, and the user's permission.
- A demo passcode can be enabled in Settings. Its fixed value is **1234**. It is only a UI simulation: it does **not** protect data, authenticate anyone, or provide Face ID/Touch ID. Never enter a real password or sensitive financial information.

Settings, icon order, widget choices, recent apps and saved pairs use `localStorage`. Transactions, categories, accounts, notes, calendar events, Safari tabs/bookmarks/history and captured photos use IndexedDB via Dexie. Storage is local to this browser/origin; clearing browser data, private browsing, quota limits, or unavailable IndexedDB can remove or prevent persistence. Storage failures are surfaced in the UI where possible.

## PWA and offline behavior

The production build includes a web manifest and service worker. On a secure origin (or localhost), after one successful online visit and service-worker installation, the shell, built-in lazy app chunks, artwork and internal Safari demo pages can run offline. External websites and browser camera availability remain subject to network and browser restrictions. Installation is a web-app convenience, not a native iOS app.

## Tests

```bash
npm run lint
npm run test                 # Vitest + React Testing Library
npx playwright install chromium
npm run test:e2e             # desktop Chromium + touch/mobile emulation
npm run test:offline         # builds/serves production and tests the PWA offline
npm run build                # strict TypeScript and Vite production build
```

Playwright may require its operating-system browser dependencies (`npx playwright install-deps chromium` on supported systems). Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium executable if needed. The browser suite checks pose transitions, theme and wallpaper persistence, Safari tabs/bookmarks/history, accounting validation and exact balances, calculator operations, independent Split View windows and hinge clearance, notes/events, icon ordering, reset, lock simulation, and touch interactions. Mobile coverage is browser emulation, not a claim of testing on every physical device.

## Architecture

- `src/device` — device frame, pose and display simulation.
- `src/system` — Zustand state, Home/Lock screens, status bar, overlays, and window manager.
- `src/apps` — app registry and independently loaded app modules.
- `src/persistence` — Dexie schema, sample data, and reset.
- `src/utils` — currency, calculator, calendar, time, and translation helpers.
- `src/tests` and `e2e` — unit/component and browser tests.

React + strict TypeScript, Vite, Tailwind utilities/custom CSS, Motion, Zustand, Dexie, and Lucide are used. The original wallpaper and travel image in `public/` were generated for this concept; app artwork is custom SVG/CSS and Lucide-based. No Apple design-kit files or proprietary fonts are bundled.

## Design references

The physical and adaptive-layout starting points were reviewed against:

1. [Apple Newsroom — Apple unveils iPhone Duo](https://www.apple.com/newsroom/2026/09/apple-unveils-iphone-duo/)
2. [Apple Human Interface Guidelines — Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
3. [Apple Design Resources](https://developer.apple.com/design/resources/)

Unspecified interaction details, sample content, animations, layouts, and hardware rendering are design decisions for this web concept—not claims about Apple's implementation. Apple, iPhone, iOS, and Safari are trademarks of their respective owner.
