<p align="center">
  <img src="https://img.shields.io/badge/Venice.ai-Image_Studio_Pro-FF6B35?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDJMMiA3bDEwIDUgMTAtNS0xMC01eiIvPjxwYXRoIGQ9Ik0yIDE3bDEwIDUgMTAtNSIvPjxwYXRoIGQ9Ik0yIDEybDEwIDUgMTAtNSIvPjwvc3ZnPg==" alt="Venice.ai Image Studio Pro" />
</p>

<h1 align="center">🎨 Venice.ai Image Studio Pro</h1>

<p align="center">
  <strong>A professional-grade, privacy-first AI Image & Video generation studio</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#documentation">Docs</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white" alt="PWA Ready" />
  <img src="https://img.shields.io/badge/Tests-Passing-4CAF50?style=flat-square" alt="Tests Passing" />
</p>

<p align="center">
  <img width="1536" height="1024" alt="483854870-514bd1e1-6ef5-4403-8d0a-441881c5217e" src="https://github.com/user-attachments/assets/cf3a29e9-de2b-4465-8b76-41c1142eb617" />
</p>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤖 Multi-Model AI Support
- **Google Gemini** (Flash 2.0, Pro, 2.5 Flash)
- **Venice.ai** (Flux, SDXL, and more)
- **Video Generation** via Veo
- Seamless model switching

</td>
<td width="50%">

### 🔐 Privacy-First Architecture
- **Client-side encryption** (AES-GCM)
- **Local storage** only (IndexedDB + localStorage)
- **No server-side data** collection
- Password strength enforcement

</td>
</tr>
<tr>
<td width="50%">

### 🎛️ Advanced Controls
- Seed control for reproducibility
- Multiple aspect ratios
- Negative prompts
- Image upscaling & enhancement
- Batch generation (variants)

</td>
<td width="50%">

### 📱 Progressive Web App
- **Install on any device**
- Offline-capable
- Responsive design
- Fast loading

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** 9+
- API keys from [Google AI Studio](https://aistudio.google.com/apikey) and/or [Venice.ai](https://venice.ai/settings/api)

### Installation

```bash
# Clone the repository
git clone https://github.com/AbstergoSweden/image_app_01.git
cd image_app_01

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Using the Setup Script

For automated setup (recommended for CI/new developers):

```bash
chmod +x setup_jules.sh
./setup_jules.sh
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19, TypeScript 5.8 |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **Testing** | Vitest (unit), Playwright (E2E) |
| **Linting** | ESLint 9 + Prettier |
| **Storage** | IndexedDB (blobs), localStorage (metadata) |
| **Security** | PBKDF2 + AES-GCM, zxcvbn |
| **PWA** | vite-plugin-pwa + Workbox |

---

## 📁 Project Structure

```
image_app_01/
├── 📁 .github/              # GitHub templates & workflows
│   ├── ISSUE_TEMPLATE/      # Bug report & feature request templates
│   └── PULL_REQUEST_TEMPLATE.md
├── 📁 e2e/                  # Playwright E2E tests
│   └── app.spec.ts
├── 📁 src/
│   ├── 📁 components/       # React UI components
│   │   ├── AuthScreen.tsx   # Login/registration with password strength
│   │   ├── ChatScreen.tsx   # AI chat interface
│   │   ├── Gallery.tsx      # Image gallery with pagination
│   │   ├── ImageGenScreen.tsx # Main generation interface
│   │   └── ...
│   ├── 📁 services/         # API clients & storage
│   │   ├── geminiService.ts # Google Gemini API
│   │   ├── veniceService.ts # Venice.ai API
│   │   ├── secureStorage.ts # Encrypted localStorage
│   │   └── blobStorage.ts   # IndexedDB for images
│   ├── 📁 utils/            # Helper functions
│   │   ├── crypto.ts        # Encryption utilities
│   │   ├── migrations.ts    # Data format migrations
│   │   └── passwordStrength.ts
│   ├── 📁 types/            # TypeScript definitions
│   ├── 📁 workers/          # Web Workers
│   ├── App.tsx              # Main application
│   └── main.tsx             # Entry point
├── 📄 index.html            # HTML shell
├── 📄 vite.config.ts        # Vite + PWA configuration
├── 📄 tsconfig.json         # TypeScript configuration
├── 📄 eslint.config.js      # ESLint flat config
├── 📄 playwright.config.ts  # E2E test configuration
└── 📄 package.json          # Dependencies & scripts
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | TypeScript type checking |
| `npm run preflight` | Full CI check (types + lint + test + build) |

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file (or set in your deployment):

```bash
# Google Gemini API Key
# Get one from: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_key_here

# Venice.ai API Key
# Get one from: https://venice.ai/settings/api
VENICE_API_KEY=your_venice_key_here
```

> 💡 **Tip:** API keys can also be entered directly in the app's Settings screen.

---

## 🔒 Security

This application follows security best practices:

- **Client-side encryption**: All user data is encrypted with AES-GCM before storage
- **PBKDF2 key derivation**: Passwords are never stored; they derive encryption keys
- **Password strength**: Registration requires minimum strength score (zxcvbn)
- **No telemetry**: Zero data sent to external servers (except AI API calls)
- **CSP-ready**: Content Security Policy compatible architecture

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## 🧪 Testing

### Unit Tests

```bash
npm run test           # Run once
npm run test:watch     # Watch mode
```

### E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run `npm run preflight` to verify
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📋 Known Issues & Roadmap

### Current Limitations

- Large bundle size (~1.3MB) - consider code splitting
- Some components use `any` types - TypeScript strict mode pending
- State management is prop-drilling - consider Zustand/Jotai for scale

### Roadmap

- [ ] Code splitting for faster initial load
- [ ] Full TypeScript strict mode compliance
- [ ] State management refactor (Zustand)
- [ ] Cloud sync option (optional, encrypted)
- [ ] Mobile app (React Native / Capacitor)

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ for the AI art community</strong>
</p>

<p align="center">
  <a href="https://github.com/AbstergoSweden/image_app_01/issues">Report Bug</a> •
  <a href="https://github.com/AbstergoSweden/image_app_01/issues">Request Feature</a>
</p>
