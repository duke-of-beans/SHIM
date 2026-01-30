# SHIM Infrastructure Evaluation - Conversation Starters

**Purpose:** Ready-to-use prompts for initiating the SHIM infrastructure evaluation  
**Updated:** January 10, 2026

---

## 🎯 Why Use These Starters

**The Problem:**
You (the infrastructure creator) may have biases toward the work you've created. A fresh Claude instance can evaluate the infrastructure more objectively as SHIM's advocate.

**The Solution:**
These conversation starters position Claude as an independent evaluator who will:
1. Read the actual source code and documentation
2. Find bugs, issues, and gaps
3. Assess whether infrastructure serves SHIM's actual needs
4. Recommend modifications or alternatives
5. Make evidence-based decisions, not conceptual guesses

---

## 📝 Option 1: Comprehensive Starter (Recommended)

**Copy this into a fresh Claude Desktop conversation:**

```markdown
Hi Claude,

I need you to critically evaluate a development infrastructure proposal for the SHIM (Session Health & Integrity Manager) project.

**Your role:** Act as SHIM's advocate. Question everything. Think independently. Recommend what actually serves SHIM, not what looks impressive.

**The task:**
1. Read this evaluation framework:
   D:\SHIM\INFRASTRUCTURE_EVALUATION_PROMPT.md

2. **CRITICALLY IMPORTANT:** Read the actual source code:
   - D:\SHIM\scripts\Setup.ps1 (420 lines)
   - D:\SHIM\scripts\Dev.ps1 (350 lines)
   - D:\SHIM\scripts\Validate.ps1 (380 lines)
   - D:\SHIM\scripts\Session-End.ps1 (340 lines)
   - D:\SHIM\scripts\Continue.ps1 (320 lines)

3. Review the documentation:
   - D:\SHIM\docs\SHIM_ENVIRONMENT_BLUEPRINT.md (95KB)
   - D:\SHIM\docs\CLAUDE_INSTRUCTIONS_PROJECT.md (25KB)
   - D:\SHIM\IMPLEMENTATION_CHECKLIST.md (12KB)
   - D:\SHIM\scripts\README.md (15KB)

4. Find bugs, issues, edge cases, and quality problems in the actual code.

5. Work through the evaluation framework's questions, using evidence from your code review.

6. Recommend one of five options:
   - Option A: Full adoption
   - Option B: Selective adoption (specify what to keep/modify/remove)
   - Option C: Minimal adoption (basic git hooks only)
   - Option D: Custom approach (build SHIM-specific infrastructure)
   - Option E: Prototype first (defer infrastructure)

7. Provide a structured evaluation report with:
   - Code review findings (bugs, quality assessment)
   - Component-by-component decisions (with evidence)
   - Modifications required (with line numbers)
   - Implementation plan

**Key principles:**
- Don't just evaluate concepts - read the actual code
- Find real bugs and issues, not just theoretical concerns
- Base decisions on evidence, not assumptions
- Propose better alternatives if you see them
- Be SHIM's advocate, not the infrastructure's defender

Ready? Start by reading the evaluation framework, then conduct your code review.
```

---

## 📝 Option 2: Ultra-Concise Starter

**Copy this into a fresh Claude Desktop conversation:**

```markdown
Evaluate D:\SHIM infrastructure proposal critically.

Framework: D:\SHIM\INFRASTRUCTURE_EVALUATION_PROMPT.md

Tasks:
1. Read PowerShell source code (5 scripts in D:\SHIM\scripts\)
2. Review documentation for bugs and issues
3. Decide: Full/Selective/Minimal/Custom/Prototype-first
4. Report findings with evidence

Act as SHIM's advocate. Find problems. Recommend what works.
```

---

## 🎯 How to Use These Starters

### Approach 1: Fresh Claude Session (Recommended - Most Objective)

**Steps:**
1. Open Claude Desktop
2. Start NEW conversation (not this one)
3. Copy-paste either starter above
4. Let Claude read framework and conduct evaluation
5. Claude will provide structured assessment

**Why this works:**
- Fresh Claude has no attachment to infrastructure created
- Can critique objectively without creator bias
- Acts as independent code reviewer
- Finds bugs you might have missed
- Makes evidence-based decisions

**Best for:**
- Serious evaluation with unbiased perspective
- Finding real bugs and quality issues
- Getting honest assessment of value vs. complexity
- Making informed adoption decisions

---

### Approach 2: This Session (Less Objective, But Faster)

**If you want this Claude instance to evaluate:**

**Steps:**
1. In THIS conversation, say:
   "Please evaluate the SHIM infrastructure you created. Be critical. Act as SHIM's advocate, not the infrastructure's defender. Follow the framework in D:\SHIM\INFRASTRUCTURE_EVALUATION_PROMPT.md. Read all the source code first."

2. Claude will switch modes from creator to evaluator
3. Conduct code review and assessment
4. Provide structured report

**Trade-offs:**
- ✅ Faster (no need to re-explain context)
- ✅ Same Claude has full creation context
- ❌ Less objective (created the infrastructure)
- ❌ May be biased toward own work
- ❌ Might miss issues due to familiarity

**Best for:**
- Quick sanity check
- Finding obvious issues immediately
- Iterative refinement
- When speed matters more than objectivity

---

### Approach 3: Hybrid Approach (User-Led with Claude Support)

**Steps:**
1. YOU read the evaluation framework
2. YOU read the source code yourself
3. YOU form initial opinions
4. Use Claude to:
   - Validate your thinking
   - Find issues you missed
   - Challenge your assumptions
   - Provide alternative perspectives

**Example prompts:**
```markdown
"I think Setup.ps1 has error handling issues. Review lines 80-120 and tell me if I'm right."

"I'm concerned Validate.ps1 will be too slow. Analyze the performance and estimate execution time."

"I think we should skip Continue.ps1. Challenge my thinking - what am I missing?"
```

**Trade-offs:**
- ✅ You maintain agency and judgment
- ✅ Claude as assistant, not decision-maker
- ✅ Learn infrastructure deeply through review
- ❌ More time-intensive
- ❌ Requires technical code review skills

**Best for:**
- Experienced developers who want to evaluate personally
- Learning-oriented approach
- Building deep infrastructure knowledge
- Collaborative decision-making

---

## 🎓 Why Separation of Creation & Evaluation Works

**Psychology of Unbiased Assessment:**

**Creator Mindset:**
- Attached to work created
- Defensive about choices made
- Sees complexity as sophistication
- Overlooks issues due to familiarity
- Justifies decisions already made

**Evaluator Mindset:**
- No emotional attachment
- Questions everything
- Sees complexity as cost
- Fresh eyes catch issues
- Recommends what serves user, not creator

**The Shift:**
By using a fresh Claude session (or explicitly switching roles), you get:
- Independent code review
- Honest assessment of bugs and quality
- Critical analysis of architecture decisions
- Evidence-based recommendations
- User-centric (SHIM-centric) perspective

**Real-World Analog:**
- Code review by different team member
- External audit of infrastructure
- Consultant assessment vs. internal team
- Peer review in academic research

---

## ✅ Success Criteria for Evaluation

**Good evaluation includes:**

1. **Code Review Findings:**
   - Actual bugs found (with line numbers)
   - Quality assessment (maintainability, error handling)
   - Platform compatibility issues identified
   - Security concerns flagged
   - Performance impacts measured

2. **Evidence-Based Decisions:**
   - Every recommendation backed by code analysis
   - Specific examples from source files
   - Priority levels assigned (P0-P3)
   - Trade-offs clearly articulated

3. **Actionable Recommendations:**
   - Clear decision (Option A/B/C/D/E)
   - Component-by-component assessment
   - Specific modifications needed
   - Implementation plan with timeline

4. **Critical Thinking:**
   - Challenges assumptions
   - Proposes alternatives
   - Questions necessity of components
   - Assesses complexity vs. value

**Red flags (inadequate evaluation):**
- ❌ "Looks good" without reading code
- ❌ Conceptual opinions without evidence
- ❌ Accepting infrastructure because it's impressive
- ❌ No bugs or issues found (unrealistic)
- ❌ Vague recommendations without specifics

---

## 🎯 Expected Outcomes

**After evaluation, you should have:**

1. **Clarity on bugs and issues:**
   - P0 blockers that must be fixed
   - P1-P3 issues prioritized
   - Quality assessment grounded in reality

2. **Informed decision:**
   - Evidence-based choice (not gut feeling)
   - Understanding of trade-offs
   - Confidence in path forward

3. **Actionable plan:**
   - Week-by-week implementation steps
   - Modifications needed (with line numbers)
   - Clear next actions

4. **Risk awareness:**
   - Known issues documented
   - Mitigation strategies identified
   - Confidence level assessed

---

## 📊 Evaluation Quality Checklist

**Before considering evaluation complete, verify:**

- [ ] All 5 PowerShell scripts read in full
- [ ] All documentation files reviewed
- [ ] Bugs found and documented with line numbers
- [ ] Quality metrics assessed (error handling, maintainability, etc.)
- [ ] Platform compatibility checked
- [ ] Performance impact estimated
- [ ] Clear decision made (A/B/C/D/E)
- [ ] Component assessments justified with evidence
- [ ] Modifications specified with concrete changes
- [ ] Implementation plan provided
- [ ] Risks and confidence level stated

**If any item unchecked, evaluation is incomplete.**

---

## 🚀 Ready to Begin

**Choose your approach:**

1. **Objective evaluation?** → Copy Option 1 (Comprehensive) → Start fresh Claude session
2. **Quick check?** → Use Approach 2 (This session)
3. **Deep learning?** → Try Approach 3 (Hybrid user-led)

**Remember:**
- Read the code, don't just evaluate concepts
- Find bugs, don't just assess architecture
- Recommend what serves SHIM, not what's impressive
- Provide evidence, not opinions

**Good luck! 🎯**

---

*The goal is informed decision-making, not rubber-stamping impressive infrastructure.*
