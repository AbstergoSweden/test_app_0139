#!/usr/bin/env zsh
set -e

# Config
REPO_NAME="image_app_01"
COLOR_GREEN="\033[32m"
COLOR_YELLOW="\033[33m"
COLOR_RED="\033[31m"
COLOR_RESET="\033[0m"

echo -e "${COLOR_GREEN}Starting setup for ${REPO_NAME}...${COLOR_RESET}"

# 1. Environment Checks
echo "\nChecking environment..."
if ! command -v node &> /dev/null; then
    echo "${COLOR_RED}Node.js is not installed. Please install Node.js (v18+).${COLOR_RESET}"
    exit 1
fi
echo "Node.js $(node -v) detected."

if ! command -v git &> /dev/null; then
    echo "${COLOR_RED}Git is not installed.${COLOR_RESET}"
    exit 1
fi

# 2. Dependencies
echo "\nInstalling dependencies..."
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

# 3. Env Setup
echo "\nSetting up environment variables..."
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "${COLOR_YELLOW}Created .env.local from example. PLEASE EDIT IT with your API keys.${COLOR_RESET}"
    else
        echo "${COLOR_YELLOW}No .env.example found. Creating empty .env.local...${COLOR_RESET}"
        touch .env.local
        echo "GEMINI_API_KEY=" >> .env.local
        echo "VENICE_API_KEY=" >> .env.local
    fi
else
    echo ".env.local already exists."
fi

# 4. Best Advice / Fixes
echo "\n${COLOR_GREEN}Applying Best Advice & Fixes...${COLOR_RESET}"
echo "1. ${COLOR_YELLOW}LocalStorage Quota:${COLOR_RESET} We have implemented a quota check, but avoid generating 100s of videos without clearing history."
echo "2. ${COLOR_YELLOW}Performance:${COLOR_RESET} Encryption is heavy. The app debounces saves by 2s. Do not close the tab immediately after generating."
echo "3. ${COLOR_YELLOW}Linting:${COLOR_RESET} We use a standard lint config. If you see 'any' type errors, try to fix them, but 'npm run lint' is configured to warn only for now."

# 5. Verification
echo "\nRunning Preflight Checks (Lint, Types, Tests, Build)..."
npm run preflight

if [ $? -eq 0 ]; then
    echo "\n${COLOR_GREEN}✅ Setup Complete! You are ready to code.${COLOR_RESET}"
    echo "Run 'npm run dev' to start the server."
else
    echo "\n${COLOR_RED}❌ Preflight checks failed. Please review the errors above.${COLOR_RESET}"
    exit 1
fi
