# Architecture

The frontend uses React 18, Vite, Tailwind CSS and Framer Motion. The landing page adds scoped GSAP motion and a dynamically imported Three.js renderer with a local SVG fallback. The same Node handlers run under `backend/server.js` locally or through re-exports in `api/` and `frontend/api/` on serverless deployments.

`shared/` contains the recipe contract, quantities/scaling, pantry comparison, independent safety rules, adaptations, editing, weekly shopping aggregation and nutrition arithmetic. Both browser and server use these validators. Live generation exchanges bounded JSON, not Markdown. Groq text generation defaults to `openai/gpt-oss-20b`; vision requires explicit configuration. One provider request is made per generation/adaptation/conversion attempt.

Server authentication verifies the SDK's current Bearer credential with Puter's fixed HTTPS identity endpoint. It rejects temporary accounts and does not trust local profile IDs. MongoDB provides atomic conditional quota increments, per-user/global limits, consent records, TTL measurement events and anonymous operating records. Credentials stay on the server or in the SDK; optional raw recipe history is disabled by default.

Browser account stores persist pantry, plans, meal journal and cooking progress. Cookbook uses immutable save/delete operations in account-scoped browser storage and individual Puter KV keys. Merging retains operations and tombstones; the latest timestamp/operation ID selects the visible revision. Corrupt and offline data is preserved rather than replaced with defaults. Browser account namespacing is not an origin security boundary.

Nutrition search uses USDA Foundation/SR Legacy foods. The server retrieves selected records in a bounded batch and calculates from confirmed gram weights and per-100-g values. Unknown nutrients remain partial. The frontend stores the source snapshots with the recipe; editing invalidates their fingerprint.

Optional product measurement uploads projected events after consent. Consent versions prevent an older queue from restoring revoked data. Withdrawal changes consent before deletion; writers recheck after insert to handle concurrent revocation. Events expire after 90 days; summaries cover 30 days. Operator access requires a server allowlist. Operating metrics store no account/recipe identity and mark missing token usage or pricing as unpriced.

[API contracts](1400_api_reference_and_schemas.md), [environment setup](../README.md) and [release verification](1700_release_verification.md) provide operational details. Provider billing caps and real-device verification are separate from code-level request limits and mocked tests.
