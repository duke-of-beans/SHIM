# SHIM IMPLEMENTATION CHECKLIST
**Step-by-Step Setup and Verification Guide**

**Version:** 1.0.0  
**Date:** January 10, 2026  
**Purpose:** Complete setup guide from zero to first development session  
**Estimated Time:** 2-3 hours

---

## Overview

This checklist guides you through complete SHIM environment setup. Follow steps in order - each builds on the previous.

**You'll create:**
- Complete development environment
- Quality gates and git automation
- KERNL integration
- Documentation structure
- Testing infrastructure

**You'll verify:**
- All tools work correctly
- Git hooks trigger properly
- KERNL tools accessible
- Scripts execute without errors

---

## Step 1: Run Setup Script (15 minutes)

### What This Does

The Setup.ps1 script performs automated environment configuration:

1. Verifies prerequisites (Node.js, npm, git)
2. Installs npm dependencies
3. Creates git hooks (pre-commit, post-commit)
4. Prompts for KERNL registration
5. Creates CURRENT_STATUS.md
6. Creates CONTINUATION_PROMPT_NEXT_SESSION.md
7. Verifies configuration files
8. Runs initial build test

### How to Run

```powershell
cd D:\SHIM
.\scripts\Setup.ps1
```

### Expected Output

```
╔════════════════════════════════════════════════════════════════╗
║                    SETUP COMPLETE                              ║
╚════════════════════════════════════════════════════════════════╝

✅ Prerequisites verified
✅ Dependencies installed
✅ Git hooks configured
✅ KERNL registration instructions provided
✅ Documentation structure created
✅ Configuration verified
✅ Initial build test completed
```

### Troubleshooting

**If "Node.js not found":**
- Install from https://nodejs.org/ (LTS version recommended)
- Restart PowerShell after installation

**If "Git not found":**
- Install from https://git-scm.com/
- Restart PowerShell after installation

**If npm install fails:**
- Check internet connection
- Try `npm cache clean --force` then re-run
- Verify package.json exists

**If git hooks fail to create:**
- Check .git directory exists (run `git init` if needed)
- Verify write permissions to .git/hooks/

---

## Step 2: Register with KERNL (10 minutes)

### What This Does

Connects SHIM to KERNL for session management, file operations, and intelligence features.

### How to Do This

In Claude Desktop, run these commands:

```typescript
// 1. Register project
KERNL:pm_register_project({
  id: "shim",
  name: "SHIM - Crash Prevention System",
  path: "D:\\SHIM",
  config: {
    fileScanning: {
      enabled: true,
      mode: "auto",
      excludes: ["node_modules", "dist", ".git", "coverage"]
    },
    git: {
      enabled: true,
      autoCommit: false  // Manual commits via Desktop Commander
    }
  }
})

// 2. Index files for semantic search
KERNL:pm_index_files({
  project: "shim",
  reindex: false
})

// 3. Verify registration
KERNL:pm_get_project({ project: "shim" })
```

### Expected Result

```json
{
  "id": "shim",
  "name": "SHIM - Crash Prevention System",
  "path": "D:\\SHIM",
  "indexed": true,
  "fileCount": 25
}
```

### Troubleshooting

**If KERNL tools not available:**
- Check MCP connection in Claude Desktop settings
- Restart Claude Desktop
- Verify Desktop Commander is running

**If path error:**
- Verify D:\SHIM exists
- Use double backslashes in path: "D:\\SHIM"
- Check path spelling carefully

**If indexing fails:**
- Ensure files exist in D:\SHIM
- Check disk space
- Verify file permissions

---

## Step 3: Setup Global Instructions (Optional - 5 minutes)

### What This Does

Creates shared global instructions (if you have other projects using GREGORE-style workflows).

### Option A: Shared via Symlink (Recommended)

```powershell
# Create shared directory
New-Item -ItemType Directory -Path "D:\SHARED_CLAUDE_INSTRUCTIONS" -Force

# Copy global instructions
Copy-Item `
  "D:\GREGORE\docs\CLAUDE_INSTRUCTIONS_GLOBAL.md" `
  "D:\SHARED_CLAUDE_INSTRUCTIONS\GLOBAL_V4.4.0.md"

# Create symlink in SHIM
New-Item `
  -ItemType SymbolicLink `
  -Path "D:\SHIM\docs\CLAUDE_INSTRUCTIONS_GLOBAL.md" `
  -Target "D:\SHARED_CLAUDE_INSTRUCTIONS\GLOBAL_V4.4.0.md" `
  -Force
```

### Option B: Separate Copy (Simpler)

```powershell
# Just keep separate copy in SHIM
# No symlink needed
# Already exists in D:\SHIM\docs\CLAUDE_INSTRUCTIONS_GLOBAL.md
```

### When to Use Each

**Use Option A if:**
- You have multiple projects (GREGORE, SHIM, others)
- You want single source of truth
- You're comfortable with symlinks

**Use Option B if:**
- SHIM is your only project
- You prefer simpler setup
- You want independence from other projects

### Skip This Step If

- You don't have GREGORE project
- You don't want shared global instructions
- You prefer per-project customization

---

## Step 4: Verify Git Hooks (2 minutes)

### What This Does

Ensures pre-commit and post-commit hooks are installed and working.

### How to Verify

```powershell
# Check hooks exist
Test-Path ".git\hooks\pre-commit"     # Should be True
Test-Path ".git\hooks\post-commit"    # Should be True

# View pre-commit hook
Get-Content ".git\hooks\pre-commit"

# Test pre-commit hook manually
echo "# Test" >> test.txt
git add test.txt
git commit -m "test: verify hooks"
# Should run TypeScript check, tests, coverage
```

### Expected Behavior

**Pre-commit hook should:**
- Run TypeScript compilation (npx tsc --noEmit)
- Run tests (npm test)
- Check coverage (≥80% threshold)
- Block commit if any check fails
- Display which check failed

**Post-commit hook should:**
- Update CURRENT_STATUS.md with latest commit
- Update timestamp
- Run silently (no output)

### Troubleshooting

**If hooks don't run:**
- Check hooks are executable
- Verify hooks have proper shebang (#!/bin/sh)
- Check Git version (git --version, should be 2.x+)

**If hooks run but don't block:**
- Check exit codes in hook scripts
- Verify error messages display
- Try `git commit --no-verify` to bypass for testing

**If TypeScript errors not caught:**
- Verify npx tsc --noEmit works manually
- Check tsconfig.json exists
- Run `npm install` again

---

## Step 5: Test Development Workflow (15 minutes)

### What This Does

Verifies all scripts work correctly in real workflow.

### Test Sequence

```powershell
# Test 1: Dev.ps1 (session starter)
.\scripts\Dev.ps1

# Expected: Shows project status, build health, commands

# Test 2: Validate.ps1 (quality gates)
.\scripts\Validate.ps1

# Expected: Runs all 6 validation gates, reports status

# Test 3: Continue.ps1 (continuation prompts)
.\scripts\Continue.ps1 -Generate

# Expected: Creates CONTINUATION_PROMPT_NEXT_SESSION.md

# Test 4: View continuation
.\scripts\Continue.ps1 -View

# Expected: Displays continuation prompt

# Test 5: Session-End.ps1 (make a test commit)
# First make a small change
"# Test" | Out-File -FilePath "test.txt" -Encoding utf8

# Then run session end
.\scripts\Session-End.ps1 -CommitMessage "test: verify session-end workflow"

# Expected: Validates, commits, generates continuation prompt

# Clean up test commit (optional)
git reset --soft HEAD~1
Remove-Item "test.txt" -Force
```

### Expected Results

**Dev.ps1 output:**
```
╔════════════════════════════════════════════════════════════════╗
║                    SHIM DEVELOPMENT                            ║
╚════════════════════════════════════════════════════════════════╝

==> Environment Status
    Node.js: v20.10.0
    npm: 10.2.3
    TypeScript: 5.3.3
    Git: 2.43.0

==> Project Status
    Branch: main
    Commits: 1
    Uncommitted: 0 files

==> Build Health
    ✓ TypeScript: 0 errors
    ✓ Tests: Passing
```

**Validate.ps1 output:**
```
╔════════════════════════════════════════════════════════════════╗
║                  ✓ VALIDATION PASSED                          ║
╚════════════════════════════════════════════════════════════════╝
```

**Session-End.ps1 output:**
```
╔════════════════════════════════════════════════════════════════╗
║                    SESSION COMPLETE                            ║
╚════════════════════════════════════════════════════════════════╝

Next session: Run .\scripts\Dev.ps1 to resume
```

### Troubleshooting

**If Dev.ps1 shows errors:**
- Check build status manually: `npm run build`
- Check tests manually: `npm test`
- Verify all files in place

**If Validate.ps1 fails:**
- Check which gate failed
- Fix issues shown in output
- Re-run validation

**If Continue.ps1 errors:**
- Check SOURCE_OF_TRUTH.md exists
- Verify coverage/coverage-summary.json exists
- Check git is initialized

**If Session-End.ps1 fails:**
- Check validation passes first
- Verify git status shows changes
- Check conventional commit format

---

## Step 6: Configure Claude Desktop (5 minutes)

### What This Does

Ensures Claude Desktop can find project-specific instructions.

### Files to Verify

Check these files exist and are readable:

```powershell
# Global instructions (shared or local)
Test-Path "D:\SHIM\docs\CLAUDE_INSTRUCTIONS_GLOBAL.md"

# Project instructions (SHIM-specific)
Test-Path "D:\SHIM\docs\CLAUDE_INSTRUCTIONS_PROJECT.md"

# Source of truth
Test-Path "D:\SHIM\docs\SOURCE_OF_TRUTH.md"

# Roadmap
Test-Path "D:\SHIM\docs\ROADMAP.md"
```

### Bootstrap Test

In Claude Desktop, test bootstrap sequence:

```typescript
// This should load session context automatically
KERNL:get_session_context({
  project: "shim",
  messageCount: 20
})
```

Expected response shows:
- needsResume: false (fresh start)
- projectStatus: active
- phase: "Phase 1: Crash Prevention"

### Troubleshooting

**If files not found:**
- Check file paths carefully
- Verify files created by Setup.ps1
- Create manually if missing

**If KERNL tools error:**
- Check project registered (Step 2)
- Verify path correct
- Try pm_list_projects to see all projects

**If bootstrap doesn't work:**
- Check Claude Desktop connected to Desktop Commander
- Verify KERNL MCP server running
- Restart Claude Desktop

---

## Step 7: First Real Development Session (30 minutes)

### What to Do

Now that environment is set up, begin actual SHIM implementation:

### Morning Routine (5 minutes)

```powershell
# Start development session
cd D:\SHIM
.\scripts\Dev.ps1

# In Claude Desktop:
# Bootstrap automatically runs via project instructions
```

### Development Work (20 minutes)

Begin Week 1, Days 2-5 work:
- Implement SignalCollector class
- Write unit tests
- Verify against spec

### Session End (5 minutes)

```powershell
# Validate work
.\scripts\Validate.ps1

# Commit (if validation passes)
.\scripts\Session-End.ps1 -CommitMessage "feat(signals): implement basic SignalCollector"

# Or fast mode (skip validation if already run)
.\scripts\Session-End.ps1 -SkipValidation -CommitMessage "..."
```

---

## Verification Checklist

### ✅ After Step 1 (Setup)

- [ ] Node.js, npm, git, TypeScript installed
- [ ] npm dependencies installed successfully
- [ ] Git hooks created in .git/hooks/
- [ ] CURRENT_STATUS.md exists
- [ ] CONTINUATION_PROMPT_NEXT_SESSION.md exists
- [ ] Initial build passes (npm run build works)

### ✅ After Step 2 (KERNL)

- [ ] Project registered with KERNL
- [ ] pm_get_project returns project info
- [ ] File indexing complete
- [ ] KERNL tools accessible in Claude Desktop

### ✅ After Step 3 (Global Instructions)

- [ ] Global instructions file exists
- [ ] Symlink works (if using Option A)
- [ ] Or separate copy exists (if using Option B)
- [ ] File readable by Claude Desktop

### ✅ After Step 4 (Git Hooks)

- [ ] Pre-commit hook exists and is executable
- [ ] Post-commit hook exists and is executable
- [ ] Test commit triggers validation
- [ ] Failed validation blocks commit
- [ ] Successful validation allows commit

### ✅ After Step 5 (Workflow Test)

- [ ] Dev.ps1 runs without errors
- [ ] Validate.ps1 runs all 6 gates
- [ ] Continue.ps1 generates prompt
- [ ] Session-End.ps1 commits and generates continuation
- [ ] All scripts work as expected

### ✅ After Step 6 (Claude Desktop)

- [ ] Project instructions readable
- [ ] Bootstrap sequence works
- [ ] KERNL tools accessible
- [ ] Session context loads correctly

### ✅ After Step 7 (First Session)

- [ ] Morning routine smooth
- [ ] Development work uninterrupted
- [ ] Session end workflow works
- [ ] Ready for next session

---

## Common Issues and Solutions

### Issue: npm install fails with permission errors

**Solution:**
```powershell
# Run PowerShell as Administrator
# OR
npm config set prefix C:\Users\<YourUsername>\AppData\Roaming\npm
```

### Issue: Git hooks not executing

**Solution:**
```powershell
# Make hooks executable (Git Bash)
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/post-commit

# OR recreate hooks
.\scripts\Setup.ps1 -SkipDependencies
```

### Issue: TypeScript errors in validation

**Solution:**
```powershell
# Check tsconfig.json exists
# Verify TypeScript installed
npx tsc --version

# Reinstall if needed
npm install -D typescript
```

### Issue: Tests failing unexpectedly

**Solution:**
```powershell
# Clear jest cache
npm test -- --clearCache

# Reinstall dependencies
Remove-Item node_modules -Recurse -Force
npm install
```

### Issue: KERNL tools not available

**Solution:**
1. Check Claude Desktop settings → MCP Connections
2. Verify Desktop Commander is running
3. Restart Claude Desktop
4. Try pm_list_projects to verify connection

### Issue: Validation passes but commit still blocked

**Solution:**
```powershell
# Check git hooks exit codes
cat .git/hooks/pre-commit

# Verify last line is "exit 0"
# If not, fix hook script
```

### Issue: Continuation prompt not generating

**Solution:**
```powershell
# Run manually to see errors
.\scripts\Continue.ps1 -Generate

# Check SOURCE_OF_TRUTH.md exists
# Verify git initialized
# Check coverage directory exists
```

---

## Success Indicators

### You know setup is successful when:

1. ✅ All scripts run without errors
2. ✅ Git commit workflow works automatically
3. ✅ Validation blocks bad commits
4. ✅ KERNL tools accessible in Claude Desktop
5. ✅ Bootstrap sequence loads context
6. ✅ Continuation prompts generate correctly
7. ✅ Dev.ps1 shows accurate project status
8. ✅ You can begin SignalCollector implementation

### First successful development loop:

1. Run Dev.ps1 (session start)
2. Implement feature
3. Run Validate.ps1 (quality check)
4. Commit with Session-End.ps1
5. Next session resumes automatically

---

## Next Steps

### After Setup Complete

1. **Read documentation:**
   - SHIM_ENVIRONMENT_BLUEPRINT.md (comprehensive guide)
   - CLAUDE_INSTRUCTIONS_PROJECT.md (daily usage)
   - scripts/README.md (script details)

2. **Begin implementation:**
   - Week 1, Days 2-5: SignalCollector
   - Follow SPEC_CRASH_PREVENTION.md
   - TDD approach (tests first)

3. **Practice workflows:**
   - Morning routine (Dev.ps1 + bootstrap)
   - Development loop (edit → test → validate)
   - Session end (validate → commit → continuation)

4. **Customize as needed:**
   - Adjust quality thresholds
   - Add project-specific triggers
   - Extend scripts for SHIM needs

---

## Estimated Timeline

**Total setup time:** 2-3 hours

- Step 1 (Setup): 15 min
- Step 2 (KERNL): 10 min
- Step 3 (Global): 5 min (optional)
- Step 4 (Git Hooks): 2 min
- Step 5 (Workflow Test): 15 min
- Step 6 (Claude Desktop): 5 min
- Step 7 (First Session): 30 min
- Buffer for troubleshooting: 30-60 min

---

## Support

### If stuck:

1. **Check this checklist** for troubleshooting section
2. **Read error messages** carefully (they're usually accurate)
3. **Review relevant documentation** (Blueprint, README)
4. **Test components individually** (isolate the problem)
5. **Ask Claude Desktop** with specific error message

### Remember:

- Setup is one-time investment
- Takes 2-3 hours now
- Saves hours every week
- Worth the initial effort

---

**Once complete, you'll have:**
- ✅ Complete development environment
- ✅ Zero manual overhead workflows
- ✅ Automatic quality enforcement
- ✅ Session management with crash recovery
- ✅ Intelligence layer for code search
- ✅ Ready to build SHIM Phase 1

**Philosophy:** "Do it right the first time. Build infrastructure once, use forever."

---

*Checklist Version 1.0.0*  
*Last Updated: January 10, 2026*  
*Estimated setup time: 2-3 hours*
