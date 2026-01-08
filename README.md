# image_app_01

![Venice.ai Studio](https://via.placeholder.com/1200x300/0f172a/60a5fa?text=Venice.ai+Image+Studio+Pro)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev/)

**A professional-grade, uncensored AI Image & Video generation studio built for power users.**

Key features include local persistence, advanced model selection (Gemini 2.0/3.0, Venice.ai), and a privacy-first architecture.

---

## 🚀 Features

- **Multi-Model Support**: Seamlessly switch between Google Gemini (Flash/Pro) and Venice.ai models.
- **Image & Video**: Generate high-quality images and videos (via Veo).
- **Local Privacy**: History and settings stored locally (with encryption).
- **Advanced Controls**: Seed control, aspect ratios, negative prompts, and upscaling.
- **Secure Architecture**: Client-side API key management.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (via CDN/Utility)
- **Icons**: Lucide React
- **Testing**: Vitest
- **Linting**: ESLint (Flat Config) + Prettier

---

## 📦 Installation & Setup

We include a robust setup script for new developers ("Jules").

1. **Clone the repository**:

   ```bash
   git clone https://github.com/AbstergoSweden/image_app_01.git
   cd image_app_01
   ```

2. **Run the Setup Script**:

   ```bash
   chmod +x setup_jules.sh
   ./setup_jules.sh
   ```

   This script will check your environment, install dependencies, and run verification tests.

3. **Manual Setup**:

   ```bash
   npm install
   cp .env.example .env.local
   # Edit .env.local with your API keys
   npm run dev
   ```

---

## ✅ Best Practices & Known Issues

- **Linting**: Run `npm run lint` regularly. We use a relaxed config for legacy code but strict rules for new additions.
- **Storage**: Large video files are stored in `localStorage`. Watch for quota warnings (added in v0.2). Future updates will migrate to IndexedDB.
- **Verification**: Always run `npm run preflight` before pushing. This runs types, lint, tests, and build checks.

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Verify (`npm run preflight`)
5. Push to the Branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

---

![Footer](https://via.placeholder.com/1200x50/0f172a/334155?text=Built+with+Integrity)
