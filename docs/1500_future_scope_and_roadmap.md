# Remaining roadmap

Updated 2026-10-06. Implemented: persistent pantry/reminder dates, reviewed deductions, editing/legacy conversion, weekly planning/shopping lists, resumable cooking, opt-in measurement and USDA nutrition integration. These are no longer future features.

## Release work

Complete real Puter/two-device cloud, shared MongoDB quota concurrency, text/vision provider and nutrition smoke tests. Configure provider monetary controls, USDA key, operator identities and model rates. [Release verification](1700_release_verification.md) records exact missing configuration and steps; no production readiness claim follows from local mock coverage.

## Validate with households

Run a four-week study with a small, defined audience. Collect consented confirmed dinners, return cooking, shopping answers, failures, feedback and operating costs. Interview users about pantry maintenance and why they stop. These measurements describe reported behavior, not automatic proof of demand or causality.

## Candidate improvements

- Cross-device pantry/plans/progress synchronization and explicit recipe conflict resolution beyond device-clock ordering.
- Better ingredient normalization, verified package/barcode imports and density data; preserve explicit confirmation for uncertain records.
- Preparation/cooking yield factors, nutrient retention and broader verified nutrition coverage.
- Household collaboration, recurring plans, leftovers and pantry reminder notifications.
- Comprehensive accessibility audit and real iOS/Android/offline device testing.

Delivery APIs, health app synchronization, connected appliances, public social feeds and subscriptions remain unimplemented hypotheses. Do not present dated delivery promises, prices or paywalls as shipped behavior. Prioritize them only when usage evidence supports the additional maintenance.
