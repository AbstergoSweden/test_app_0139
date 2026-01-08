# Repository Guidelines

## Project Structure & Module Organization
- `components/` holds React UI building blocks (screens, controls, modals, gallery).
- `services/` contains API clients and storage helpers (Venice, Gemini, Firebase, secure storage).
- `utils/` and `utils.ts` provide shared helpers (crypto utilities live in `utils/crypto.ts`).
- Entry points are `index.tsx` and `App.tsx`; shared types live in `types.ts`.
- Assets and metadata are minimal and live alongside the root (`index.html`, `metadata.json`).
- Architecture: client-side SPA with React 19 (`^19.2.3`) + TypeScript.
- Module system: ESM via `index.html` import map pointing to `esm.sh`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start the Vite dev server for local development.
- `npm run build`: create a production build in `dist/`.
- `npm run preview`: serve the production build locally for smoke checks.
- `npm run lint`: run strict ESLint checks (fails on warnings).
- `npm run format`: auto-format with Prettier.
- `npm run format:check`: verify formatting in CI.

## Coding Style & Naming Conventions
- Use TypeScript with React functional components and hooks (`useState`, `useEffect`).
- Prefer strict typing; avoid `any` unless there is no alternative.
- Tailwind CSS classes are the primary styling mechanism (loaded via CDN in `index.html`).
- Indentation follows the existing TypeScript/React files (2 spaces).
- File naming matches current patterns: `PascalCase.tsx` for components, `camelCase.ts` for helpers.
- Formatting is enforced by Prettier; linting by ESLint (see `eslint.config.js`).

## Testing Guidelines
- No automated test framework is configured yet.
- If you add tests, document the framework and add a corresponding `npm` script.
- Keep test files near the code they validate (e.g., `components/ComponentName.test.tsx`).

## Commit & Pull Request Guidelines
- Commit messages: imperative mood, present tense, max ~72 chars in the first line.
- Reference related issues/PRs in the body when applicable.
- PRs should include a clear description, testing notes, and screenshots for UI changes.
- Ensure builds pass and linting (if added) is clean before requesting review.

## Security & Configuration Tips
- API keys can be set in the UI or via `.env` (`VENICE_API_KEY`, `GEMINI_API_KEY`).
- User data is intended to stay client-side and encrypted; avoid adding server-side storage.
- AI integration: `@google/genai` for chat/logic and Venice.ai REST calls for image generation.
- Persistence: local React state + browser `localStorage`.
