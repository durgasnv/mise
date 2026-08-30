# Project Learnings

## Backend Structure

- Keep database connection logic separate from the Express app setup. A `connectDB` helper makes startup and serverless reuse easier to manage.
- Use environment variables for secrets and deployment-specific values. `MONGO_URI` and `GROQ_API_KEY` should never be hardcoded.
- Validate request bodies before calling external APIs. This avoids unnecessary API calls and gives users clear `400` errors for bad input.

## MongoDB and Mongoose

- Mongoose schemas should match the data the app actually saves. For this app, recipe documents store the original 3 ingredients, generated recipe name, prep time, full ingredient list, instructions, and creation time.
- Schema validation protects the database from incomplete AI output. Required fields and array validators are useful when saving generated content.
- `createdAt` can be handled with a `Date.now` default when only a creation timestamp is needed.

## Groq AI Handling

- A strong system prompt improves consistency, but backend validation is still required. AI output should never be trusted blindly.
- Ask the model for JSON only, then clean common markdown fences like ```json before parsing.
- Wrap `JSON.parse` in `try-catch` so invalid AI responses can return a meaningful error instead of crashing the server.
- Log raw AI responses only when debugging parse failures. Avoid noisy logs in normal successful requests.

## Vite Environment Variables

- Vite only exposes variables prefixed with `VITE_`.
- Frontend API URLs should come from an env variable like `VITE_API_URL`.
- Restart the Vite dev server after changing `.env` values.
- Keep a `.env.example` file so setup requirements are clear without committing secrets.

## Frontend UX

- Loading and error states make recipe generation easier to understand.
- Small animations, like a fade-in and slight slide-up on the recipe card, make generated content feel more responsive.
- Respect `prefers-reduced-motion` for users who prefer less animation.
- Keep API error messages readable so users know what went wrong.

## Git Workflow

- Use small commits with Conventional Commit messages, such as `feat:`, `refactor:`, `chore:`, and `docs:`.
- Group related changes together. Backend API changes, frontend UI updates, and deployment setup should usually be separate commits.
- Check what is staged before committing to avoid mixing unrelated files.
