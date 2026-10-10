# DiveLedger 🤿 — Offline Dive Gear Service Log

> **Her ekipmanın bakım hikâyesi tek defterde.**
> Every item's service story in one logbook.

[![Verify and deploy GitHub Pages](https://github.com/Flynntaggart26/dive-ledger/actions/workflows/pages.yml/badge.svg)](https://github.com/Flynntaggart26/dive-ledger/actions/workflows/pages.yml)
[![Live site](https://img.shields.io/badge/demo-live%20site-0e8a7d)](https://flynntaggart26.github.io/dive-ledger/)

**🌊 Live app:** [flynntaggart26.github.io/dive-ledger](https://flynntaggart26.github.io/dive-ledger/)
**🌐 Languages:** Türkçe (default) + English — switch with **TR / EN** in the header.

DiveLedger is an **offline-first, bilingual (TR/EN) PWA** for recreational divers who want their gear details and maintenance history in one private place. No account, no backend, no tracking — your data lives in your browser's IndexedDB and works even with no connection after the first visit.

---

## ✨ Features

| Area | What you get |
| --- | --- |
| 📋 **Service dashboard** | At-a-glance counts — overdue, due soon (30 days), current, no date — plus an attention list sorted by date |
| 🧰 **Gear registry** | Regulator, BCD, cylinder, computer + other; brand/model, serial no., purchase date, **your own** next-service date |
| 🕰️ **Service history** | Per-item timeline (date, provider, work done, notes); a service record can roll the next-service date forward |
| 🏷️ **QR labels** | Each label encodes **only the opaque gear ID** — no serial, no notes. Opens the item in the same browser profile; printable via the detail dialog |
| ✅ **Pre-dive checklist** | Editable, checkable, resettable list stored locally |
| 💾 **Backup** | One-click JSON export/import (validated before overwrite) + CSV gear export with stable columns |
| 📴 **Offline PWA** | Installable, service-worker cached app shell; Turkish-first UI with full English translation |

> **Honest scope:** DiveLedger is a log and reminder — not a certificate. It records the dates *you* enter and never invents manufacturer intervals, condition scores, or go/no-go advice. Always follow your gear manufacturer's service schedule and a certified technician's judgment.

---

## 🚀 Quick start

```sh
npm install
npm run dev      # local dev server
npm test         # unit tests (node --test)
npm run build    # production build into dist/
```

Then serve `dist/` over HTTP (service workers require it) and open the URL. On the live site, use **Add to Home Screen / Install** for the full offline PWA experience.

**Try it in 60 seconds:**
1. Open the [live app](https://flynntaggart26.github.io/dive-ledger/) → **Ekipman** → **+ Ekipman ekle**.
2. Add your regulator with a next-service date a week from today.
3. See it appear on the **Panel** under “due soon”, open it, add a service record, and generate its QR label.
4. Go to **Yedek** → **JSON indir** to keep a backup.

---

## 🧭 How it works

- **Storage:** IndexedDB (`equipment`, `services`, `checklist`, `meta` stores). Dates are compared as UTC `YYYY-MM-DD` day boundaries — no timezone drift.
- **Status logic:** `overdue` (past) · `soon` (within 30 days) · `current` · `unset` (no date entered, always explicit).
- **QR:** deep links look like `…/#/equipment/<opaque-id>` and resolve only where that browser profile holds the matching record. There is no cross-device lookup in this release — move data with JSON export/import.
- **Import safety:** JSON backups are schema- and version-checked (`dive-ledger-backup v1`); malformed files are rejected without touching current data, and overwrite requires explicit confirmation.

---

## 🛠️ Tech

- **Vite** + dependency-light vanilla JS (ES modules), **`qrcode`** for label generation
- PWA: `manifest.webmanifest` + cache-first service worker for the app shell (user data stays in IndexedDB)
- CI/CD: GitHub Actions verifies (`node --test`), builds, and deploys `dist/` to GitHub Pages on every `main` push

```text
.
├── index.html / styles.css          # app shell + maritime-logbook theme
├── src/
│   ├── main.mjs                     # views, dialogs, dashboard rendering
│   ├── store.mjs                    # IndexedDB repository
│   ├── domain.mjs                   # validation, UTC dates, CSV, backup parsing
│   ├── i18n.mjs                     # TR/EN strings + default checklist
│   └── qr.mjs                       # opaque-ID deep links + QR data URLs
├── public/                          # manifest, icon, service worker
├── tests/                           # node:test suites (domain, i18n, deep-links)
└── .github/workflows/pages.yml      # verify → build → deploy
```

---

## 🗺️ Roadmap

- [x] Offline gear registry + service timeline
- [x] QR labels + printable detail cards
- [x] Checklist + JSON/CSV backup, TR/EN UI
- [ ] Photo attachments for gear (IndexedDB blobs)
- [ ] Per-item custom reminder windows
- [ ] Shared club inventory (opt-in cloud sync) — out of scope for the offline MVP

---

## 🤝 Contributing & privacy

Issues and PRs are welcome. The app has **no backend, no analytics, no accounts** — language choice and all records stay in your browser. Google Fonts loads from Google's CDN when online, with system-font fallbacks offline.

## 🔗 Links

- **Live app:** [flynntaggart26.github.io/dive-ledger](https://flynntaggart26.github.io/dive-ledger/)
- **Repository:** [github.com/Flynntaggart26/dive-ledger](https://github.com/Flynntaggart26/dive-ledger)
- **Actions:** [Verify and deploy GitHub Pages](https://github.com/Flynntaggart26/dive-ledger/actions/workflows/pages.yml)
