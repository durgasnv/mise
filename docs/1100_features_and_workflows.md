# Features and workflows

Updated 2026-10-06.

1. Sign in with Puter for API services. Demo profiles support local previews. Server identity verification determines account quotas; browser profiles do not establish authorization.
2. Enter ingredients and available amounts or load persisted pantry stock. Confirm staples, yield, available time, equipment, dietary restrictions and exclusions. Photos require typed ingredient confirmation and an explicitly configured vision model.
3. Request one recommended dinner, with up to two alternatives. Server and browser validate the structured recipe and independently check known inventory/dietary conflicts. Errors preserve the form and do not fabricate fallback dinners.
4. Scale structured quantities and linked method amounts. Times, temperatures and package labels remain fixed. Text-only legacy recipes retain original text until a reviewed conversion creates a separate structured copy.
5. Edit title, yield, timings, ingredients, equipment and linked method steps. Saving validates the revision again and preserves cookbook operation history. Substitution requests adapt the whole recipe rather than renaming food.
6. Open cooking mode. Timers use deadlines and survive refresh; steps, checks and review confirmation persist per account on this device. Resume active sessions from the kitchen. Confirm completion explicitly; rating and shopping feedback are optional.
7. Review actual pantry use after completion before deduction. Unknown/incompatible amounts require manual confirmation. Stock is never deducted automatically from a timer or twice for the same session. Reminder dates are user-entered, not inferred freshness.
8. Schedule structured saved recipes in a weekly plan. Shopping demand combines scaled ingredient amounts and subtracts available stock once. Unknown quantities and incompatible units remain visible. Plans retain the scheduled recipe snapshot rather than silently following later edits.
9. Match ingredients to USDA Foundation/SR Legacy records and confirm edible gram weights. Calculation covers known nutrients and shows partial coverage. Portion scaling adjusts totals; recipe changes invalidate older calculations. Save the recipe to persist its nutrition record in the cookbook.
10. Opt in to optional activity sharing from Meal activity & privacy. Shared summaries cover confirmed dinners, return days, shopping answers, ratings and generation failures/duration. Operators see aggregate consented activity and anonymous request token/cost totals. Opt-out stops local collection, clears the queue and requests deletion; offline deletion retries.

Cookbook uses account-scoped browser operation logs and Puter KV synchronization. Offline local changes survive retries; delete tombstones prevent older saves from returning. A shared legacy browser collection requires explicit ownership import. Timestamp conflict resolution can be affected by device clock skew.

Complete text export includes recipe, amounts, method and checks. The image postcard is a shortened preview. Voice reading depends on browser support; an elapsed timer is not a doneness or meal-completion signal.

Persistent pantry, plans, cooking progress and local meal journal remain on this device. Cookbook cloud sync and server measurements are separate services. See [release verification](1700_release_verification.md) for unverified live paths.
