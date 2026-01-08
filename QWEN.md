# Qwen Code Context File

## Project Overview

This is a professional-grade, uncensored AI Image & Video generation studio built for power users. The application is called "Venice.ai Image Studio Pro" and is built with React 19, TypeScript, and Vite. It features multi-model support (Google Gemini and Venice.ai), local persistence with encryption, and a privacy-first architecture.

### Key Features
- Multi-Model Support: Seamlessly switch between Google Gemini (Flash/Pro) and Venice.ai models
- Image & Video Generation: Generate high-quality images and videos (via Veo)
- Local Privacy: History and settings stored locally with encryption
- Advanced Controls: Seed control, aspect ratios, negative prompts, and upscaling
- Secure Architecture: Client-side API key management

### Tech Stack
- Frontend: React 19, TypeScript
- Build Tool: Vite
- Styling: Tailwind CSS (via CDN/Utility)
- Icons: Lucide React
- Testing: Vitest
- Linting: ESLint (Flat Config) + Prettier
- Dependencies: @google/genai, firebase, lucide-react, react, react-dom

## Project Structure

```
.
├── .github/                 # GitHub configuration
├── src/                     # Source code
│   ├── assets/              # Static assets
│   ├── components/          # React UI components
│   ├── constants/           # Application constants
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API clients and storage helpers
│   ├── test/                # Test files
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── workers/             # Web Workers
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── .env.example            # Environment variable example
├── index.html              # HTML entry point
├── package.json            # Project dependencies and scripts
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript configuration
├── eslint.config.js        # ESLint configuration
└── README.md               # Project documentation
```

### Core Components
- `AuthScreen.tsx`: Authentication screen with encrypted user data
- `ImageGenScreen.tsx`: Main image generation interface
- `ChatScreen.tsx`: AI chat functionality
- `Gallery.tsx`: Image gallery with local storage
- `SettingsScreen.tsx`: Application settings
- `ImageViewer.tsx`: Modal for viewing generated content
- `ControlPanel.tsx`: Generation controls and parameters

### Services
- `veniceService.ts`: Venice.ai API integration
- `geminiService.ts`: Google Gemini API integration
- `secureStorage.ts`: Encrypted local storage using IndexedDB
- `crypto.ts`: Cryptographic utilities

## Building and Running

### Installation
```bash
npm install
cp .env.example .env.local
# Edit .env.local with your API keys
npm run dev
```

### Development Commands
- `npm run dev`: Start the Vite dev server for local development
- `npm run build`: Create a production build in `dist/`
- `npm run preview`: Serve the production build locally for smoke checks
- `npm run lint`: Run strict ESLint checks
- `npm run format`: Auto-format with Prettier
- `npm run format:check`: Verify formatting in CI
- `npm run test`: Run unit tests with Vitest
- `npm run preflight`: Run typecheck, lint, test, and build checks

### Environment Variables
- `GEMINI_API_KEY`: Google Gemini API key
- `VENICE_API_KEY`: Venice.ai API key

## Development Conventions

### Coding Style
- Use TypeScript with React functional components and hooks
- Strict typing is encouraged; avoid `any` where possible
- Use Tailwind CSS classes for styling
- Indentation follows 2 spaces
- File naming: PascalCase.tsx for components, camelCase.ts for helpers
- Formatting is enforced by Prettier; linting by ESLint

### Git Commit Messages
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### Security Considerations
- API keys are managed client-side and stored in environment variables
- User data is encrypted and stored locally using IndexedDB
- Strong password requirements recommended for encryption
- No server-side storage of user data

## Architecture Notes

### State Management
- Uses React hooks (useState, useEffect) for state management
- User data is stored in the main App component and passed down via props
- As the app grows, consider moving to Zustand or Jotai for better state management

### Data Persistence
- Implements IndexedDB for blob storage to resolve localStorage 5MB quota limits
- PBKDF2 key derivation is offloaded to Web Workers to prevent UI blocking
- Includes graceful quota error handling and automatic blob cleanup

### API Integration
- Supports both Google Gemini and Venice.ai APIs
- Handles both image and video generation (Veo for video)
- Includes error handling for API key issues and permission errors

## Testing Guidelines

- Unit tests use Vitest
- Follow existing patterns in the `src/test/` directory
- Keep test files near the code they validate (e.g., `components/ComponentName.test.tsx`)
- Add end-to-end tests (Playwright/Cypress) to verify full user flows including storage persistence

## Known Issues and Recommendations

### Current Issues
- UI flicker when gallery images load from IndexedDB (async hydration)
- Users with extremely old data formats (pre-v1) might need manual migration

### Recommendations
- Consider state management solutions like Zustand or Jotai as the app grows
- Add password strength enforcement using zxcvbn
- Implement optimistic updates for better UX
- Add service worker for PWA functionality
- Add pagination or virtual scrolling for galleries with >1000 items