# DiveLedger 🤿

Offline-first dive gear service log. Turkish-first, bilingual (TR/EN) PWA — no account, no backend, data stays on the device.

**Status:** MVP scaffold + domain logic done. UI works from `vite dev` / `vite build`.

## What it does

- Gear registry: regulator, BCD, cylinder, computer, other — with serial, purchase date, user-entered next service date
- Dashboard groups user-entered dates as overdue / due soon / current / no date
- Service history per item; next-service date updates from a service record
- QR labels contain only the opaque gear ID and open the item in the same browser profile
- Editable pre-dive checklist stored locally
- JSON backup export/import + CSV gear export
- The app records dates you enter. It does not invent manufacturer intervals or certify gear.

## Run

```sh
npm install
npm run dev
npm test
npm run build
```

Serve `dist/` over HTTP for the installed PWA + service worker.

## Project layout

```text
index.html          # shell + dialogs
styles.css
src/main.mjs        # UI wiring
src/store.mjs       # IndexedDB repository
src/domain.mjs      # validation, dates, CSV, backup
src/i18n.mjs        # TR/EN strings
src/qr.mjs          # opaque-ID deep links + QR data URLs
public/manifest.webmanifest, icon.svg, sw.js
tests/              # node --test
```
