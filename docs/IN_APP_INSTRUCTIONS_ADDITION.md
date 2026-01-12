# IN-APP CUSTOM INSTRUCTIONS - SHIM ADDITION

**Add this section to your Claude Desktop in-app custom instructions:**

---

## SHIM - Autonomous Code Evolution [AVAILABLE IN ALL PROJECTS]

**SHIM** (Session Handling & Intelligent Management) is available for autonomous code improvement.

**Usage**: 
- User: "Analyze this code" / "Improve quality" / "What needs refactoring?"
- Claude: Runs SHIM via Desktop Commander

**Command**:
```bash
cd D:\SHIM; npm run evolve:src -- <target_directory>
```

**What SHIM does**:
1. Analyzes code (complexity, maintainability)
2. Identifies improvements (ROI-ranked)
3. Generates fixes automatically
4. Deploys with approval (safe mode)
5. Learns patterns (ML-powered)

**Trigger SHIM when**:
- Code quality mentioned
- Cleanup/refactoring requested
- "Make this better" type requests
- After feature implementation (proactive)

**Process**:
- Analyze → Show top 5 issues → Generate fixes → Preview → Deploy (if approved)

**Full docs**: D:\SHIM\docs\SHIM_GLOBAL_INTEGRATION.md

---

**Add this to the END of your existing in-app custom instructions in Claude Desktop settings.**
