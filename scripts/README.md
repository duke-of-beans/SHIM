# SHIM Development Scripts

This directory contains PowerShell scripts for managing SHIM development workflow with automated quality gates, session management, and continuous validation.

---

## Quick Start

```powershell
# One-time setup (run once)
.\scripts\Setup.ps1

# Start development session
.\scripts\Dev.ps1

# During development
npm test --watch              # TDD mode
npx tsc --watch              # Type checking

# Before committing
.\scripts\Validate.ps1       # Full validation

# End session
.\scripts\Session-End.ps1    # Validate + commit + handoff
```

---

## Scripts Overview

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `Setup.ps1` | One-time environment setup | First time, or after fresh clone |
| `Dev.ps1` | Development session starter | Beginning each work session |
| `Validate.ps1` | Pre-commit validation | Before commits, CI/CD |
| `Session-End.ps1` | End session with commit | End of work session |
| `Continue.ps1` | Generate continuation prompt | Session end, handoff documentation |

---

## Detailed Usage

### Setup.ps1 - One-Time Environment Setup

**Purpose:** Configure development environment, install dependencies, set up git hooks, create documentation structure.

**Usage:**
```powershell
# Full setup
.\scripts\Setup.ps1

# Skip specific steps
.\scripts\Setup.ps1 -SkipDependencies    # Skip npm install
.\scripts\Setup.ps1 -SkipGitHooks        # Skip git hooks setup
.\scripts\Setup.ps1 -SkipKERNL           # Skip KERNL registration prompt

# Verbose output
.\scripts\Setup.ps1 -Verbose
```

**What it does:**
1. ✅ Verifies prerequisites (Node.js, npm, git, TypeScript)
2. ✅ Installs npm dependencies
3. ✅ Creates git hooks (pre-commit, post-commit)
4. ✅ Provides KERNL registration instructions
5. ✅ Creates `CURRENT_STATUS.md`
6. ✅ Creates `CONTINUATION_PROMPT_NEXT_SESSION.md`
7. ✅ Verifies TypeScript and Jest configuration
8. ✅ Runs initial build test

**When to run:**
- First time setting up the project
- After cloning repository on new machine
- After major environment changes

---

### Dev.ps1 - Development Session Starter

**Purpose:** Verify environment, display project status, and provide quick reference for common commands.

**Usage:**
```powershell
# Full session start (recommended)
.\scripts\Dev.ps1

# Quick start (skip checks)
.\scripts\Dev.ps1 -Quick

# Skip git status check
.\scripts\Dev.ps1 -SkipGitCheck

# Show continuation prompt
.\scripts\Dev.ps1 -ShowContinuation

# Verbose output
.\scripts\Dev.ps1 -Verbose
```

**What it displays:**
- ✅ Environment verification (Node.js, dependencies)
- ✅ Project status (branch, commits, latest commit)
- ✅ Uncommitted changes (if any)
- ✅ Build health (TypeScript errors, test status)
- ✅ Current phase and week
- ✅ Available commands reference
- ✅ Continuation from previous session
- ✅ Claude Desktop bootstrap sequence
- ✅ Quality reminders
- ✅ Key files reference

**When to run:**
- Beginning of each development session
- After pulling latest changes
- When resuming work after break

---

### Validate.ps1 - Pre-Commit Validation

**Purpose:** Comprehensive quality gate verification before commits.

**Usage:**
```powershell
# Full validation (all gates)
.\scripts\Validate.ps1

# Fast mode (skip if no changes)
.\scripts\Validate.ps1 -Fast

# Skip specific gates
.\scripts\Validate.ps1 -SkipTests           # Skip unit tests
.\scripts\Validate.ps1 -SkipCoverage        # Skip coverage check
.\scripts\Validate.ps1 -SkipTypeScript      # Skip TypeScript check

# Verbose output
.\scripts\Validate.ps1 -Verbose
```

**Validation Gates:**

1. **Gate 1: TypeScript Compilation**
   - Checks: `npx tsc --noEmit`
   - Must be: 0 errors ✅
   - Blocks commit: YES

2. **Gate 2: Unit Tests**
   - Checks: `npm test`
   - Must be: All passing ✅
   - Blocks commit: YES

3. **Gate 3: Test Coverage**
   - Checks: Coverage ≥80% (lines, branches, functions, statements)
   - Must be: All thresholds met ✅
   - Blocks commit: YES

4. **Gate 4: Git Status**
   - Checks: Working tree status
   - Info only (non-blocking)

5. **Gate 5: File Size Analysis**
   - Checks: Source files <1MB
   - Warnings only (non-blocking)

6. **Gate 6: Performance Benchmarks**
   - Checks: Benchmark tests (if exist)
   - Warnings only (non-blocking)

**Exit codes:**
- `0` = All gates passed ✅
- `1` = Validation failed ❌

**When to run:**
- Before every commit (automatically via pre-commit hook)
- During CI/CD pipeline
- When testing quality gates

---

### Session-End.ps1 - Session End Protocol

**Purpose:** Automated session end with validation, commit, and continuation prompt generation.

**Usage:**
```powershell
# Interactive mode (will prompt for commit message)
.\scripts\Session-End.ps1

# With commit message
.\scripts\Session-End.ps1 -CommitMessage "feat(signals): implement token counting"

# With conventional commit parts
.\scripts\Session-End.ps1 -CommitType "feat" -CommitScope "signals"
# (will prompt for description)

# Skip validation (not recommended)
.\scripts\Session-End.ps1 -SkipValidation

# Skip tests only
.\scripts\Session-End.ps1 -SkipTests

# Force commit despite validation failures
.\scripts\Session-End.ps1 -Force

# Verbose output
.\scripts\Session-End.ps1 -Verbose
```

**What it does:**

1. ✅ Checks git status (detects uncommitted changes)
2. ✅ Runs full validation (TypeScript, tests, coverage)
3. ✅ Prompts for commit message (if not provided)
4. ✅ Stages all changes (`git add -A`)
5. ✅ Creates commit with message
6. ✅ Generates continuation prompt
7. ✅ Updates `CURRENT_STATUS.md`
8. ✅ Optionally pushes to remote

**Commit Message Format:**

Follows Conventional Commits specification:

```
<type>(<scope>): <description>

[optional extended description]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `test`: Test additions
- `docs`: Documentation
- `refactor`: Code refactoring
- `perf`: Performance optimization
- `chore`: Maintenance

**Scopes:**
- `signals`: Observable signals system
- `checkpoint`: Checkpoint manager
- `resume`: Resume detector
- `database`: Database/repository
- `mcp`: MCP server
- `spec`: Specifications
- `config`: Configuration

**Examples:**
```powershell
# Example 1: Simple commit
.\scripts\Session-End.ps1 -CommitMessage "feat(signals): add token counting with tiktoken"

# Example 2: With extended description
.\scripts\Session-End.ps1
# (Interactive prompts will guide you)

# Example 3: Quick fix
.\scripts\Session-End.ps1 -CommitMessage "fix(checkpoint): handle empty file state"
```

**When to run:**
- End of each development session
- After completing feature/bugfix
- Before switching tasks
- When ready to share progress

---

### Continue.ps1 - Continuation Prompt Generator

**Purpose:** Generate comprehensive handoff documentation for next session.

**Usage:**
```powershell
# Generate continuation prompt
.\scripts\Continue.ps1 -Generate

# View current continuation prompt
.\scripts\Continue.ps1 -View

# Verbose output
.\scripts\Continue.ps1 -Verbose
```

**What it generates:**

Creates/updates `CONTINUATION_PROMPT_NEXT_SESSION.md` with:

1. **Session Summary**
   - Build status
   - Current phase/week
   - Git information

2. **What We Were Working On**
   - Uncommitted changes
   - Staged changes
   - Recent commits

3. **Decisions Made**
   - Architectural decisions
   - Implementation choices

4. **Progress Indicators**
   - Phase completion percentage
   - Week completion percentage
   - Milestone status

5. **Next Steps**
   - Priority-ordered tasks
   - Immediate tasks (if errors/blockers)
   - Feature work items

6. **Active Files**
   - Currently modified files
   - Key implementation files
   - Specification references

7. **Technical Context**
   - Performance targets
   - Quality thresholds
   - Infrastructure details

8. **Known Issues / Blockers**
   - Current blockers
   - Technical debt

9. **Context for Next Session**
   - Bootstrap commands (KERNL)
   - Quick reference commands

10. **Session Metrics**
    - Files modified
    - Tests written
    - Code added
    - Coverage change

Also updates `CURRENT_STATUS.md` with:
- Build status
- Current work
- Recent changes
- Next steps

**When to run:**
- End of session (automatically via `Session-End.ps1`)
- Before major context switch
- When documenting progress

---

## Workflow Patterns

### Pattern 1: Standard Development Session

```powershell
# Morning: Start session
.\scripts\Dev.ps1

# Work: TDD loop
npm test --watch    # Terminal 1: Tests
npx tsc --watch     # Terminal 2: Type checking
# Edit code...

# Before commit: Validate
.\scripts\Validate.ps1

# Evening: End session
.\scripts\Session-End.ps1
```

### Pattern 2: Quick Fix

```powershell
# Start
.\scripts\Dev.ps1 -Quick

# Fix
# Edit code...

# Validate
.\scripts\Validate.ps1 -Fast

# Commit
.\scripts\Session-End.ps1 -CommitMessage "fix(signals): correct threshold calculation"
```

### Pattern 3: Feature Development

```powershell
# Start
.\scripts\Dev.ps1 -ShowContinuation

# Implement
npm test --watch                    # TDD
# Write tests first...
# Implement feature...
# Ensure >80% coverage

# Checkpoint (mid-session)
.\scripts\Continue.ps1 -Generate    # Document progress

# Continue...
# More implementation...

# End
.\scripts\Validate.ps1              # Full validation
.\scripts\Session-End.ps1           # Commit + handoff
```

### Pattern 4: Debugging Session

```powershell
# Start
.\scripts\Dev.ps1

# Debug
npm test -- --verbose               # Run specific tests
npx tsc --noEmit                   # Check types
# Fix issues...

# Validate
.\scripts\Validate.ps1

# Commit fix
.\scripts\Session-End.ps1 -CommitMessage "fix(checkpoint): resolve compression edge case"
```

---

## Git Hooks (Automatic)

### Pre-Commit Hook

**Automatically runs before every commit:**

1. TypeScript check (`npx tsc --noEmit`)
2. Run tests (`npm test`)
3. Check coverage (≥80% threshold)

**If any check fails:** Commit is blocked ❌

**Location:** `.git/hooks/pre-commit`

**Bypass (not recommended):**
```powershell
git commit --no-verify -m "..."
```

### Post-Commit Hook

**Automatically runs after successful commit:**

1. Updates `CURRENT_STATUS.md` with latest commit info
2. Updates timestamps in documentation

**Location:** `.git/hooks/post-commit`

---

## Integration with KERNL

All scripts are designed to work seamlessly with KERNL session management.

### Bootstrap Sequence (Claude Desktop)

```typescript
// Step 1: Session context
KERNL:get_session_context({
  project: "shim",
  messageCount: 20
})

// Step 2: Load files
KERNL:pm_batch_read({
  project: "shim",
  paths: [
    "CURRENT_STATUS.md",
    "CONTINUATION_PROMPT_NEXT_SESSION.md",
    "docs/SOURCE_OF_TRUTH.md"
  ]
})
```

### During Work

```typescript
// Auto-checkpoint every 5-10 tool calls
KERNL:auto_checkpoint({
  project: "shim",
  operation: "Implementing SignalCollector",
  progress: 0.65,
  decisions: [...],
  nextSteps: [...]
})
```

### Session End

```powershell
# Scripts handle git operations
# KERNL handles session state

KERNL:mark_complete({
  project: "shim",
  summary: "Implemented token counting in SignalCollector"
})
```

---

## Troubleshooting

### "Setup.ps1 execution policy error"

**Problem:** PowerShell execution policy prevents running scripts

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "Validation fails but code looks correct"

**Problem:** Git hooks or validation catching issues

**Solution:**
```powershell
# Run validation manually to see details
.\scripts\Validate.ps1 -Verbose

# Check TypeScript errors
npx tsc --noEmit

# Check tests
npm test -- --verbose

# Check coverage
npm test -- --coverage
```

### "Continue.ps1 shows outdated information"

**Problem:** Continuation prompt not regenerated

**Solution:**
```powershell
# Regenerate manually
.\scripts\Continue.ps1 -Generate

# Should happen automatically in Session-End.ps1
```

### "Session-End.ps1 stuck at validation"

**Problem:** Validation taking too long or hanging

**Solution:**
```powershell
# Skip validation (fix issues later)
.\scripts\Session-End.ps1 -SkipValidation

# Or skip just tests
.\scripts\Session-End.ps1 -SkipTests

# Or force commit
.\scripts\Session-End.ps1 -Force
```

---

## Best Practices

### ✅ DO

- Run `Dev.ps1` at start of each session
- Run `Validate.ps1` before every commit
- Use `Session-End.ps1` for all commits
- Generate continuation prompts regularly
- Review continuation prompt between sessions
- Keep TypeScript errors at 0
- Maintain >80% test coverage
- Write tests before implementation (TDD)
- Commit frequently (atomic commits)
- Use conventional commit messages

### ❌ DON'T

- Skip validation checks
- Commit with TypeScript errors
- Commit with test failures
- Commit with <80% coverage
- Use `git commit` directly (use `Session-End.ps1`)
- Skip continuation prompt generation
- Leave work uncommitted overnight
- Make large, multi-purpose commits
- Bypass git hooks without reason

---

## Script Dependencies

```
Setup.ps1
  └─ Creates: CURRENT_STATUS.md, CONTINUATION_PROMPT_NEXT_SESSION.md
  └─ Installs: Git hooks (pre-commit, post-commit)

Dev.ps1
  └─ Reads: CURRENT_STATUS.md, CONTINUATION_PROMPT_NEXT_SESSION.md
  └─ Reads: docs/SOURCE_OF_TRUTH.md

Validate.ps1
  └─ Runs: npx tsc --noEmit
  └─ Runs: npm test
  └─ Runs: npm test -- --coverage

Continue.ps1
  └─ Creates/Updates: CONTINUATION_PROMPT_NEXT_SESSION.md
  └─ Updates: CURRENT_STATUS.md
  └─ Reads: Git status, commit history

Session-End.ps1
  └─ Runs: Validate.ps1
  └─ Runs: Git operations (add, commit, push)
  └─ Runs: Continue.ps1 -Generate
  └─ Updates: CURRENT_STATUS.md
```

---

## Files Generated

| File | Generated By | Purpose |
|------|--------------|---------|
| `CURRENT_STATUS.md` | Setup.ps1, Continue.ps1, Session-End.ps1 | Build status snapshot |
| `CONTINUATION_PROMPT_NEXT_SESSION.md` | Setup.ps1, Continue.ps1, Session-End.ps1 | Session handoff document |
| `.git/hooks/pre-commit` | Setup.ps1 | Pre-commit validation |
| `.git/hooks/post-commit` | Setup.ps1 | Post-commit doc updates |

---

## Version History

- **v1.0.0** (2026-01-10): Initial script suite
  - Setup.ps1: Environment setup
  - Dev.ps1: Session starter
  - Validate.ps1: Quality gates
  - Session-End.ps1: Session end automation
  - Continue.ps1: Continuation prompts

---

**For questions or issues with scripts, see:**
- `docs/SHIM_ENVIRONMENT_BLUEPRINT.md` - Complete environment guide
- `docs/CLAUDE_INSTRUCTIONS_PROJECT.md` - Project-specific instructions
- `docs/CLAUDE_INSTRUCTIONS_GLOBAL.md` - Global development principles
