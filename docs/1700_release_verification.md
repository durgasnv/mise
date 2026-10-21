# Release verification

Updated 2026-10-06. A staging URL means the address of a deployed test copy of Mise. Local development does not require one.

## Checks performed

- 95 regression cases passed across 25 test files; one optional live MongoDB case was skipped. A production frontend build and whitespace checks passed. Local checks cover recipe contracts, auth/quota ordering, dietary rules, pantry deductions, meal planning, editing, nutrition calculations, consent projection, opt-out deletion and account isolation.
- Playwright tests use mocked Puter identity. Desktop Chromium and an emulated Pixel 7 verify inventory persistence, shopping aggregation, cooking timer recovery, dialog focus/Escape, validated editing and consent controls. They are not real-device or real-auth tests.
- Actual local HTTP checks passed for health and anonymous rejection on generation, nutrition and measurement routes.
- Read-only Groq model lookup succeeded: the configured default text model is available to the configured account. A subsequent paid text-provider check returned a validated recipe; its sanitized result is recorded below.
- Frontend, backend and root production dependency audits report no known vulnerabilities after updating Mongoose and locking root deployment dependencies. Development tooling is outside those results.
- A direct USDA demonstration-record lookup timed out in this environment. USDA lookup tests therefore use labeled mock responses; live nutrition retrieval is not verified.

## Required configuration and evidence

| Check | Current status | How to complete |
| --- | --- | --- |
| MongoDB and shared quotas | Local connection/index/concurrency passed; hosted staging pending | Configure a staging database and verify create-index/read/write permissions. Run `MONGO_QUOTA_TEST_URI` against a dedicated test database with `npm --prefix backend test`. |
| Real Puter and text generation | Real text-provider recipe passed; signed-in two-account flow pending | Sign into two real Puter accounts, generate constrained dinners and confirm distinct returned identities. Test expired tokens and an account switch during a request. |
| Vision | Pending: no vision model | Select an available image-capable model, confirm the image's ingredient names/amounts, generate and test invalid/unsupported images. Failure must retain inputs and show an error. |
| Cloud cookbook | Pending: no real devices/accounts | On two devices save different recipes simultaneously; update one recipe concurrently; delete, go offline, save, reconnect, sign out and switch accounts. Confirm tombstones, preserved edits and no cross-account data. |
| Provider money controls | Pending: console access required | Configure the provider's monetary cap and alerts and retain operator evidence. Application attempt limits do not establish a dollar cap. See [Groq spend limits](https://console.groq.com/docs/spend-limits). |
| Nutrition | Pending: no USDA key | Configure `USDA_FDC_API_KEY`, select a Foundation/SR Legacy record matching preparation, confirm edible gram weights and compare calculations with the source record. |
| Consent and operating metrics | Local database configured; live consent/operator verification pending | Opt in, cook on two days, submit shopping feedback, fail a generation and confirm account/operator summaries. Opt out on one device while another upload is in flight; verify old consent versions cannot restore events. Set operator IDs and current model rates; missing rates must remain unpriced. |

## Repeatable commands

```bash
npm --prefix backend test
npm --prefix frontend test
npm --prefix frontend run build
# Install browser binaries once:
cd frontend
npx playwright install chromium
npm run test:e2e
# Run from backend so dotenv uses backend/.env:
cd ../backend
npm run check:release
```

`check:release` performs read-only model checks and, when `MISE_STAGING_URL` exists, health and anonymous-access checks. Setting `MISE_RUN_LIVE_GENERATION=true` with both `PUTER_TEST_TOKEN_A/B` enables two billable, quota-counted text requests. Credentials and account IDs are excluded from its JSON report. `MISE_RELEASE_REPORT_PATH` optionally saves the report. The command exits unsuccessfully while checks remain pending; it cannot certify manual device tests or a provider cap.

No deployment, production configuration or provider cap has been changed by this implementation.

## Local MongoDB verification

The development preview now has a loopback-only MongoDB Community instance configured. Connection, application quota-index initialization and real quota concurrency checks passed against local databases. A recipe-handler smoke test passed with real MongoDB and mocked identity/provider. This does not establish hosted staging connectivity or verify paid provider generation with a real account; the staging checks above remain pending.


## Seven-improvement batch verification

Service readiness checks quota-index initialization and configured text/photo/nutrition capabilities without exposing secrets. Combined `npm run dev` startup was checked with existing services and from stopped database/backend services; shutdown removed only launcher-owned processes. A real Groq text request returned one recipe that passed the shared structure, pantry and safety validators. See [sanitized live report](live-verification.json). Two permanent Puter account tokens, the vision model and USDA key remain unavailable, so those live checks remain pending.

The backend suite passed all 60 cases, including real MongoDB concurrency. All 24 desktop Chromium/emulated Pixel 7 browser checks passed, including blocked-service input retention, explicit retry, leftover planning, idempotent weekly repetition, keyboard skip navigation, labeled ingredient controls and existing cooking/dialog workflows. Frontend regressions and production build passed. New sync tests model independent device stores, competing edits, deletion, account switching, corrupt history and cycles. These are not real-device cloud tests or a comprehensive accessibility certification.

Real-device checklist: sign into two permanent accounts; save different pantry items and plans on two devices, edit the same stock/recipe while offline, reconnect, review conflicting versions, delete on one device and verify it stays deleted on the other. Resume a cooking checkpoint and confirm the timer deadline. On iOS and Android, check screen-reader form names, keyboard/switch navigation, 44px touch controls, portrait/landscape overflow and background timer recovery.
