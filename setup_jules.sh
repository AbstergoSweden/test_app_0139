#!/usr/bin/env bash
# Venice.ai Image Studio Pro - Development Setup
# - Reproducible installs: prefers `npm ci` when package-lock.json exists
# - Clear diagnostics: shows dirty working tree files if verification fails
# - Optional flags:
#     --skip-checks   : skip node/npm version checks
#     --fix-issues    : print fix instructions at end
#     --no-git-clean  : do NOT fail if git working tree is dirty (inform only)

set -euo pipefail

# -----------------------------
# Colors / formatting
# -----------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# -----------------------------
# Globals (flags)
# -----------------------------
SKIP_CHECKS=false
FIX_ISSUES=false
ENFORCE_GIT_CLEAN=true

# -----------------------------
# Logging helpers
# -----------------------------
print_banner() {
  echo -e "${CYAN}"
  echo "╔═══════════════════════════════════════════════════════════════════╗"
  echo "║                                                                   ║"
  echo "║     🎨  Venice.ai Image Studio Pro - Development Setup  🎨        ║"
  echo "║                                                                   ║"
  echo "╚═══════════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

log_divider() {
  echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_step() {
  log_divider
  echo -e "${BOLD}$1${NC}"
}

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}${BOLD}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✖${NC} $1"
}

# -----------------------------
# Utility helpers
# -----------------------------
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

require_repo_root() {
  if [[ ! -f package.json ]]; then
    log_error "package.json not found. Run this script from the repo root."
    exit 1
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --skip-checks)
        SKIP_CHECKS=true
        shift
        ;;
      --fix-issues)
        FIX_ISSUES=true
        shift
        ;;
      --no-git-clean)
        ENFORCE_GIT_CLEAN=false
        shift
        ;;
      -h|--help)
        cat <<'EOF'
Usage: ./setup_jules.sh [options]

Options:
  --skip-checks     Skip Node/npm version checks
  --fix-issues      Print fix instructions at end
  --no-git-clean    Do not fail if git working tree is dirty (inform only)
  -h, --help        Show help
EOF
        exit 0
        ;;
      *)
        log_warning "Unknown option: $1"
        shift
        ;;
    esac
  done
}

# -----------------------------
# Steps
# -----------------------------
check_node() {
  log_step "Step 1: Checking Node.js"

  if [[ "$SKIP_CHECKS" == "true" ]]; then
    log_warning "Skipping Node/npm checks (--skip-checks)."
    return 0
  fi

  if ! command_exists node; then
    log_error "Node.js not found. Install Node.js >= 18."
    exit 1
  fi

  local node_major
  node_major="$(node -v | sed 's/^v//' | cut -d. -f1)"

  if [[ "$node_major" -lt 18 ]]; then
    log_error "Node.js v18+ required. Detected: $(node -v)"
    exit 1
  fi

  log_success "Node.js $(node -v) detected"

  check_npm
}

check_npm() {
  if ! command_exists npm; then
    log_error "npm not found. Install npm."
    exit 1
  fi
  log_success "npm $(npm -v) detected"
}

install_dependencies() {
  log_step "Step 2: Installing Dependencies"

  if [[ -d node_modules ]]; then
    log_info "node_modules exists. Installing may still update dependencies if lockfile changed."
  else
    log_info "Installing fresh dependencies..."
  fi

  # Critical change: prefer npm ci to avoid rewriting package-lock.json in CI/bots.
  if [[ -f package-lock.json ]]; then
    log_info "package-lock.json detected → using ${BOLD}npm ci${NC} (reproducible, no lockfile rewrite)."
    npm ci
  else
    log_warning "No package-lock.json found → using npm install."
    npm install
  fi

  log_success "Dependencies installed"
}

setup_environment() {
  log_step "Step 3: Environment Configuration"

  if [[ ! -f .env.local ]]; then
    if [[ -f .env.example ]]; then
      cp .env.example .env.local
      log_success "Created .env.local from template"
      log_warning "Edit .env.local to add your API keys"
    else
      log_warning "No .env.example found; skipping .env.local creation"
    fi
  else
    log_success ".env.local already exists"
  fi
}

setup_playwright() {
  log_step "Step 4: Setting up E2E Testing (Playwright)"

  if [[ ! -f package.json ]]; then
    log_warning "package.json missing; skipping Playwright setup"
    return 0
  fi

  # Only try if playwright is present in deps; avoid failing on repos without it.
  if ! node -e "process.exit(require('./package.json')?.devDependencies?.playwright || require('./package.json')?.dependencies?.playwright ? 0 : 1)" >/dev/null 2>&1; then
    log_info "Playwright not detected in dependencies; skipping browser install."
    return 0
  fi

  log_info "Installing Playwright browsers..."
  # In containers, --with-deps is useful; locally it is fine too.
  npx playwright install chromium --with-deps
  log_success "Playwright setup complete"
}

run_verification() {
  log_step "Step 5: Running Verification"

  log_info "Running TypeScript check..."
  npm run typecheck
  log_success "TypeScript check passed"

  log_info "Running linter..."
  npm run lint
  log_success "Lint passed"

  log_info "Running unit tests..."
  npm run test
  log_success "All tests passed"

  log_info "Running build..."
  npm run build
  log_success "Build successful"
}

print_issue_list() {
  log_step "Known Issues (Priority Order)"

  cat <<'EOF'

Priority 1 - Quick Wins (< 1 hour each):
[DONE] 1. Gallery UI flicker on load
[DONE] 2. Password strength enforcement
[DONE] 3. Environment variable documentation
[DONE] 4. PWA service worker setup
[DONE] 5. Gallery pagination for large collections

Priority 2 - Medium Effort (1-4 hours each):
[DONE] 6. Data migration for old user formats
[DONE] 7. Optimistic updates for image generation
[DONE] 8. E2E test framework setup
[DONE] 9. Fix remaining `any` type warnings (25 warnings)
[DONE] 10. Fix React hooks dependency warnings (2 warnings)

Priority 3 - Larger Refactors (4+ hours):
[TODO] 11. Code splitting to reduce bundle size (~1.3MB)
[TODO] 12. State management refactor (Zustand/Jotai)
[TODO] 13. Full TypeScript strict mode compliance

Priority 4 - Nice to Have:
[TODO] 14. Cloud sync option (encrypted)
[TODO] 15. Additional AI model integrations
[TODO] 16. Mobile app version

EOF
}

print_fix_instructions() {
  cat <<'EOF'
Fix instructions:

A) Fix "working tree dirty due to package-lock.json"
   - Preferred: use `npm ci` instead of `npm install` in CI/bot setup scripts.
   - If lockfile and package.json are out of sync:
       npm install
       git add package-lock.json
       git commit -m "chore: update package-lock"

B) [FIXED] React hooks exhaustive-deps warnings
   - All useEffect hooks now have proper dependency arrays
   - Used useMemo to memoize values and functional updates where appropriate

C) [FIXED] @typescript-eslint/no-explicit-any warnings
   - Introduced typed interfaces for API responses and local state
   - Used unknown + type guards for error handling
   - Imported proper types from @google/genai package
EOF
}

verify_clean_worktree() {
  # Only relevant if we're inside a git repo.
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    log_info "Not a git repository; skipping git clean check."
    return 0
  fi

  # Show branch info (matches your earlier output vibe)
  local branch
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  [[ -n "$branch" ]] && log_info "On branch ${branch}"

  # Dirty if either unstaged or staged diffs exist.
  local dirty=false
  if ! git diff --quiet; then dirty=true; fi
  if ! git diff --cached --quiet; then dirty=true; fi

  if [[ "$dirty" == "true" ]]; then
    if [[ "$ENFORCE_GIT_CLEAN" == "true" ]]; then
      log_error "Working tree is dirty."
      echo
      echo "Git status (porcelain):"
      git status --porcelain || true
      echo
      log_error "Verification of Environment failed: working tree must be clean."
      log_info "Tip: If the only change is package-lock.json, use 'npm ci' instead of 'npm install'."
      exit 1
    else
      log_warning "Working tree is dirty (continuing due to --no-git-clean)."
      echo
      echo "Git status (porcelain):"
      git status --porcelain || true
      echo
      return 0
    fi
  fi

  log_success "Working tree is clean"
}

print_done() {
  log_step "Setup Complete! 🎉"
  cat <<'EOF'

Next Steps:
  1. Edit .env.local with your API keys
  2. Run npm run dev to start development
  3. Open http://localhost:3000

Useful Commands:
  npm run dev        - Start dev server
  npm run preflight  - Run all checks before committing
  npm run test:e2e   - Run E2E tests
  ./setup_jules.sh --fix-issues - Show fix instructions

EOF
}

# -----------------------------
# Main
# -----------------------------
main() {
  parse_args "$@"
  print_banner
  require_repo_root

  check_node
  install_dependencies
  setup_environment
  setup_playwright
  run_verification
  print_issue_list

  if [[ "$FIX_ISSUES" == "true" ]]; then
    print_fix_instructions
  fi

  print_done

  # Do this last so you still get the full output context before failing.
  verify_clean_worktree
}

main "$@"
