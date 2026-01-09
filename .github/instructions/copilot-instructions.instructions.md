# Copilot Instructions for Venice.ai Image Studio Pro

## Project Context

This is a professional-grade, privacy-first AI Image & Video generation studio built with React 19, TypeScript 5.8, and Vite 6. The application integrates with Google Gemini and Venice.ai APIs for image/video generation.

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (via CDN)
- **Icons**: Lucide React
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: ESLint 9 + Prettier
- **Storage**: IndexedDB (blobs), localStorage (metadata)
- **Security**: PBKDF2 + AES-GCM encryption, zxcvbn password strength

## Code Style Guidelines

### TypeScript
- **Never use `any` type** - Use `unknown` with type guards for uncertain types
- Use proper type imports: `import type { ... } from '...'`
- Prefer importing types from `@google/genai` for Gemini API types
- Define shared types in `src/types/index.ts`
- Use mapped types for complex type transformations (e.g., flattened params)

### React
- Use functional components with hooks
- Always include all dependencies in `useEffect` dependency arrays
- Use `useMemo` and `useCallback` to memoize values/functions used in dependency arrays
- Use functional update pattern for `setState` when the new value depends on current state:
  ```tsx
  // ✅ Good - functional update avoids stale closure
  setSelectedModel((current) => current === 'default' ? newValue : current);
  
  // ❌ Avoid - can cause stale closure issues
  if (selectedModel === 'default') setSelectedModel(newValue);
  ```

### Error Handling
- Use `catch (e: unknown)` instead of `catch (e: any)`
- Add type guards for error handling:
  ```tsx
  catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
  }
  ```

### File Organization
- `src/components/` - React UI components (PascalCase.tsx)
- `src/services/` - API clients and storage helpers (camelCase.ts)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions
- `src/hooks/` - Custom React hooks
- `src/constants/` - Application constants
- `src/workers/` - Web Workers

## Commands Reference

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run lint       # Run ESLint
npm run format     # Auto-format with Prettier
npm run test       # Run unit tests
npm run test:e2e   # Run E2E tests
npm run typecheck  # TypeScript type checking
npm run preflight  # Full CI check (types + lint + test + build)
```

## API Integration Notes

### Venice.ai Service (`veniceService.ts`)
- Define payload types explicitly (e.g., `VeniceImageGeneratePayload`, `VeniceChatPayload`)
- Use union types for the internal API call function
- Strip unnecessary fields when building API payloads

### Gemini Service (`geminiService.ts`)
- Import types from `@google/genai`: `Part`, `GroundingChunk`, `GenerateContentConfig`, `GenerateVideosConfig`
- Use `ChatMessage` type from `src/types/index.ts` for message arrays
- TypeScript will infer attachment types from `ChatMessage.attachments`

## Security Considerations

- API keys are managed client-side and stored encrypted
- User data is encrypted using PBKDF2 + AES-GCM before storage
- No server-side storage of user data
- Strong password requirements enforced via zxcvbn

## Known Issues (From setup_jules.sh)

### Completed
- [x] Gallery UI flicker on load
- [x] Password strength enforcement
- [x] E2E test framework setup
- [x] All `any` type warnings fixed
- [x] React hooks dependency warnings fixed

### Remaining
- [ ] Code splitting to reduce bundle size (~1.3MB)
- [ ] State management refactor (consider Zustand/Jotai)
- [ ] Full TypeScript strict mode compliance
