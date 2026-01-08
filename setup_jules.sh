#!/usr/bin/env bash
#
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║                    Venice.ai Image Studio Pro                             ║
# ║                      Jules Setup Script v1.0                              ║
# ╚═══════════════════════════════════════════════════════════════════════════╝
#
# This script sets up the development environment and guides through
# fixing known issues in priority order.
#
# Usage:
#   chmod +x setup_jules.sh
#   ./setup_jules.sh
#
# Options:
#   --skip-checks    Skip environment verification
#   --fix-issues     Run automated issue fixes
#   --help           Show this help message
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Logging functions
log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_step() { echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${BOLD}$1${NC}"; }

# Banner
print_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                   ║"
    echo "║     🎨  Venice.ai Image Studio Pro - Development Setup  🎨       ║"
    echo "║                                                                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verify Node.js version
check_node() {
    log_step "Step 1: Checking Node.js"
    
    if ! command_exists node; then
        log_error "Node.js is not installed!"
        log_info "Install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18+ required (found: $(node -v))"
        exit 1
    fi
    
    log_success "Node.js $(node -v) detected"
}

# Verify npm
check_npm() {
    if ! command_exists npm; then
        log_error "npm is not installed!"
        exit 1
    fi
    log_success "npm $(npm -v) detected"
}

# Install dependencies
install_dependencies() {
    log_step "Step 2: Installing Dependencies"
    
    if [ -d "node_modules" ]; then
        log_info "node_modules exists, checking for updates..."
        npm install --prefer-offline 2>/dev/null || npm install
    else
        log_info "Installing fresh dependencies..."
        npm install
    fi
    
    log_success "Dependencies installed"
}

# Setup environment
setup_environment() {
    log_step "Step 3: Environment Configuration"
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            log_success "Created .env.local from template"
            log_warning "Edit .env.local to add your API keys"
        else
            log_warning "No .env.example found, creating empty .env.local"
            touch .env.local
        fi
    else
        log_success ".env.local already exists"
    fi
}

# Install Playwright browsers
setup_playwright() {
    log_step "Step 4: Setting up E2E Testing (Playwright)"
    
    log_info "Installing Playwright browsers..."
    npx playwright install chromium --with-deps 2>/dev/null || {
        log_warning "Could not install Playwright dependencies (may need sudo)"
        log_info "Run manually: npx playwright install chromium"
    }
    
    log_success "Playwright setup complete"
}

# Run verification
run_verification() {
    log_step "Step 5: Running Verification"
    
    log_info "Running TypeScript check..."
    npm run typecheck || {
        log_error "TypeScript errors found!"
        return 1
    }
    log_success "TypeScript check passed"
    
    log_info "Running linter..."
    npm run lint 2>/dev/null && log_success "Lint passed" || log_warning "Lint has warnings (non-blocking)"
    
    log_info "Running unit tests..."
    npm run test || {
        log_error "Tests failed!"
        return 1
    }
    log_success "All tests passed"
    
    log_info "Running build..."
    npm run build || {
        log_error "Build failed!"
        return 1
    }
    log_success "Build successful"
}

# Print issue priority list
print_issue_list() {
    log_step "Known Issues (Priority Order)"
    
    echo -e "
${BOLD}Priority 1 - Quick Wins (< 1 hour each):${NC}
${GREEN}[DONE]${NC} 1. Gallery UI flicker on load
${GREEN}[DONE]${NC} 2. Password strength enforcement
${GREEN}[DONE]${NC} 3. Environment variable documentation
${GREEN}[DONE]${NC} 4. PWA service worker setup
${GREEN}[DONE]${NC} 5. Gallery pagination for large collections

${BOLD}Priority 2 - Medium Effort (1-4 hours each):${NC}
${GREEN}[DONE]${NC} 6. Data migration for old user formats
${GREEN}[DONE]${NC} 7. Optimistic updates for image generation
${GREEN}[DONE]${NC} 8. E2E test framework setup
${YELLOW}[TODO]${NC} 9. Fix remaining \`any\` type warnings (25 warnings)
${YELLOW}[TODO]${NC} 10. Fix React hooks dependency warnings (2 warnings)

${BOLD}Priority 3 - Larger Refactors (4+ hours):${NC}
${YELLOW}[TODO]${NC} 11. Code splitting to reduce bundle size (~1.3MB)
${YELLOW}[TODO]${NC} 12. State management refactor (Zustand/Jotai)
${YELLOW}[TODO]${NC} 13. Full TypeScript strict mode compliance

${BOLD}Priority 4 - Nice to Have:${NC}
${YELLOW}[TODO]${NC} 14. Cloud sync option (encrypted)
${YELLOW}[TODO]${NC} 15. Additional AI model integrations
${YELLOW}[TODO]${NC} 16. Mobile app version
"
}

# Provide fix commands
print_fix_commands() {
    log_step "Fix Commands for Remaining Issues"
    
    echo -e "
${BOLD}Issue 9: Fix \`any\` type warnings${NC}
Files affected:
  - src/services/geminiService.ts (8 warnings)
  - src/services/veniceService.ts (7 warnings)
  - src/components/ControlPanel.tsx (3 warnings)
  - src/App.tsx (2 warnings)
  - Others (5 warnings)

Strategy: Replace \`any\` with proper types or \`unknown\`:
${CYAN}# View all any warnings:
npm run lint 2>&1 | grep 'no-explicit-any'

# For API responses, create proper types in src/types/
# For error catches, use: catch (e: unknown)${NC}

---

${BOLD}Issue 10: Fix React hooks dependency warnings${NC}
Files: AuthScreen.tsx, ControlPanel.tsx

${CYAN}# Option A: Add missing dependencies
useEffect(() => { ... }, [knownUsers]);

# Option B: Wrap value in useMemo if intentionally static
const knownUsers = useMemo(() => getRegisteredUsers(), []);${NC}

---

${BOLD}Issue 11: Code splitting${NC}
${CYAN}# Add dynamic imports for heavy components
const Gallery = lazy(() => import('./components/Gallery'));

# Configure Rollup chunks in vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        ai: ['@google/genai', 'firebase'],
      }
    }
  }
}${NC}

---

${BOLD}Issue 12: State management${NC}
${CYAN}# Install Zustand
npm install zustand

# Create store in src/store/useAppStore.ts
# Migrate useState from App.tsx to store${NC}
"
}

# Main execution
main() {
    print_banner
    
    # Parse arguments
    SKIP_CHECKS=false
    FIX_ISSUES=false
    
    for arg in "$@"; do
        case $arg in
            --skip-checks)
                SKIP_CHECKS=true
                ;;
            --fix-issues)
                FIX_ISSUES=true
                ;;
            --help)
                echo "Usage: ./setup_jules.sh [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-checks    Skip environment verification"
                echo "  --fix-issues     Show detailed fix instructions"
                echo "  --help           Show this help message"
                exit 0
                ;;
        esac
    done
    
    if [ "$SKIP_CHECKS" = false ]; then
        check_node
        check_npm
        install_dependencies
        setup_environment
        setup_playwright
        run_verification
    fi
    
    print_issue_list
    
    if [ "$FIX_ISSUES" = true ]; then
        print_fix_commands
    fi
    
    log_step "Setup Complete! 🎉"
    
    echo -e "
${GREEN}${BOLD}Next Steps:${NC}
  1. Edit ${CYAN}.env.local${NC} with your API keys
  2. Run ${CYAN}npm run dev${NC} to start development
  3. Open ${CYAN}http://localhost:3000${NC}

${BOLD}Useful Commands:${NC}
  ${CYAN}npm run dev${NC}        - Start dev server
  ${CYAN}npm run preflight${NC}  - Run all checks before committing
  ${CYAN}npm run test:e2e${NC}   - Run E2E tests
  ${CYAN}./setup_jules.sh --fix-issues${NC} - Show fix instructions

${PURPLE}Happy coding! 🚀${NC}
"
}

main "$@"
