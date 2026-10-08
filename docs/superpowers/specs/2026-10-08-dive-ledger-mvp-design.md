# DiveLedger — Offline Equipment Passport MVP

## Purpose

Give recreational divers a simple, private place to find their gear details and maintenance history. The first release is a Turkish-first, bilingual PWA for an individual diver; it works offline after installation and requires no account or hosted database.

## Product approach

Three possible directions were considered:

1. **Offline personal gear passport (recommended):** useful immediately, installable as a PWA, and independent of accounts or a server. Cross-device club sharing can follow later.
2. **Cloud dive-center inventory:** supports shared equipment and staff, but requires authentication, a backend, access control, and deployment secrets before the first usable release.
3. **Parachute rig service/packing log:** a focused alternative, but requires more jurisdiction- and discipline-specific records than this first MVP.

The approved MVP is DiveLedger, a private-by-default offline equipment register with service history, QR labels, and a pre-dive checklist.

## Core user journey

1. Add an equipment item and enter its type, brand/model, serial number, purchase date, and user-specified next service date or reminder interval.
2. View a dashboard grouped by “upcoming”, “overdue”, and “no date set”, with date and source notes visible.
3. Record a service event against that equipment: date, service provider, action, notes, and the next user-entered service date.
4. Generate and print a QR label for an item. The label opens that item in the same installed browser profile that owns the local registry.
5. Use an editable pre-dive checklist; export a JSON backup or CSV equipment list, and restore from JSON on another device.

## Information architecture

- **Dashboard:** item count, service dates requiring attention, and a shortcut to the checklist.
- **Equipment:** searchable/filterable cards for regulator, BCD, cylinder, computer, and other gear; add/edit/archive flows.
- **Equipment detail:** identity, user-entered service interval/date, chronological service log, QR label, and notes.
- **Pre-dive checklist:** editable, checkable, resettable list stored locally.
- **Backup:** JSON export/import for the full local dataset and CSV export for equipment rows.
- **Language:** visible TR/EN toggle, Turkish default, preference stored locally.

## Data and privacy

- Use IndexedDB for equipment, service events, checklist settings, and language preference.
- Generate each equipment ID locally; QR URLs contain only the opaque ID, never the serial number or maintenance notes.
- QR deep links can resolve only where that browser profile has the matching local record. There is no cross-device lookup or shared club registry in this MVP.
- JSON import validates the file shape before replacing data; provide an export reminder and an explicit confirmation before import overwrite.
- No analytics, account, or backend. Site shell is cached by a small service worker; user data stays in IndexedDB.

## Maintenance data behavior

The app records dates/intervals supplied by the user and highlights those dates as upcoming or past due. It does not invent manufacturer intervals or calculate a technical service schedule. Items without a next-service date remain visibly “not set”. Each record is presented as a log/reminder, not as an equipment condition or safety certification.

## Visual direction

Professional maritime logbook: deep ocean/navy surfaces, warm sand pages, restrained sea-glass teal, and a small coral signal color. Use a calm dashboard hierarchy, precise tabular dates, serial-number typography, service-timeline rows, QR-ready printable cards, generous spacing, and readable contrast. Use a distinctive but dependency-light type pairing and restrained motion. Layouts work on phone, tablet, and desktop; forms/dialogs are keyboard accessible and honor reduced-motion preferences.

## Technical shape

- Vite-built, dependency-light JavaScript PWA; no server runtime.
- Small independent modules for equipment domain rules, IndexedDB repository, import/export, QR generation, and UI rendering.
- A manifest and service worker cache only the app shell and built assets; IndexedDB owns persistent user data.
- GitHub Pages deploys the static build from a GitHub Actions workflow.

## Out of scope

Club/team accounts, cloud synchronization, automated manufacturer-specific service rules, equipment condition scoring, go/no-go recommendations, dive decompression/gas planning, route/navigation planning, and emergency guidance.

## Success and verification

- A user can add, edit, archive, and find equipment; add service history; and see upcoming/past dates after reload and offline restart.
- QR labels resolve the intended local item without embedding serial number or service notes.
- JSON export/import round-trips valid data and rejects malformed input without destroying the current dataset; CSV export has stable columns.
- Checklist selections and language preference survive reload; TR and EN cover all views, validation, and empty states.
- Core date/status, validation, and migration behavior has unit tests; Playwright covers add/edit/archive, service entries, checklist reset, QR display, export/import, language switching, mobile layout, and offline shell behavior.
- GitHub Actions build/test/deploy succeeds and the published site serves over HTTPS.
