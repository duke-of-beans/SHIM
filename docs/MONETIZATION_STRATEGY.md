# SHIM: Monetization Strategy

**Version:** 1.0.0  
**Created:** January 9, 2026  
**Status:** Strategic Analysis Complete

---

## Executive Summary

SHIM operates in a market where AI coding tools range from $0-$200/month for individuals and $19-$59/user/month for enterprises. The market is in flux (Sourcegraph killed Cody Free/Pro in June 2025), creating opportunity. SHIM's unique value—crash prevention, multi-chat coordination, autonomous operation—has no direct competitor.

**Recommended Pricing:** 
- Individual: $29/month (between Copilot $10 and Cursor $20 Pro)
- Professional: $49/month (power users, parallel chat sessions)
- Team: $39/user/month (matches Copilot Enterprise pricing)

---

## Competitive Landscape Analysis

### Tier 1: Code Completion Tools (Commodity)

| Product | Individual | Team | Enterprise |
|---------|------------|------|------------|
| GitHub Copilot | $10/mo (Pro), $39/mo (Pro+) | $19/user | $39/user |
| Cursor | $20/mo (Pro) | $40/user | Custom |
| Cody (Sourcegraph) | **DISCONTINUED July 2025** | - | $59/user (Enterprise only) |

**Key Insight:** Code completion is commoditizing rapidly. Chinese models (Kimi K2, GLM 4.5) benchmark near Sonnet. This is not where value accrues.

### Tier 2: Agentic Coding Tools (Our Adjacent Space)

| Product | Individual | Team | Notes |
|---------|------------|------|-------|
| Claude Code | $20/mo (Pro), $100-200/mo (Max) | $45/user (Team) | Rate-limited, crashes without recovery |
| Cursor Agent Mode | Included in $20/mo | Included | Limited to single-file context |
| Amp (Sourcegraph) | $10 credits free | $59/user | Just launched, unclear traction |

**Key Insight:** Everyone is racing to "agentic" but **nobody is solving the infrastructure problem** (crashes, coordination, persistence). They're building the kitchen but forgetting the foundation.

### Tier 3: Developer Productivity (Indirect Competition)

| Product | Pricing | Overlap |
|---------|---------|---------|
| Linear | $10/user/month | Project management |
| Notion AI | $10/user/month add-on | Documentation |
| Raycast Pro | $10/month | Workflow automation |

**Key Insight:** These tools integrate with coding, but none solve the core problem of AI session management.

---

## Market Gap Analysis

### What Competitors Solve

1. **Code completion** - Copilot, Cursor, Cody ✓
2. **Multi-file editing** - Cursor Composer ✓
3. **Codebase search** - Sourcegraph, Copilot Enterprise ✓
4. **Agentic execution** - Claude Code, Cursor Agent ✓

### What Nobody Solves

1. **Crash recovery** - Sessions lost, context destroyed ❌
2. **Multi-chat coordination** - No primitive exists ❌
3. **Cross-session memory** - Each session starts fresh ❌
4. **Autonomous operation** - Requires human babysitting ❌
5. **Predictive checkpointing** - No one even attempts this ❌

**SHIM's Monopoly:** We're not competing on "better code completion." We're solving the infrastructure layer that makes all other tools actually usable.

---

## Pricing Strategy

### Option A: Value-Based Premium (Recommended)

Position SHIM as essential infrastructure, not optional enhancement.

| Tier | Price | Target | Value Proposition |
|------|-------|--------|-------------------|
| **Starter** | $29/month | Individual devs | Crash prevention, basic checkpointing, resume |
| **Professional** | $49/month | Power users | + Multi-chat coordination, autonomous mode |
| **Team** | $39/user/month | Teams 5+ | + Shared context, analytics, admin controls |
| **Enterprise** | Custom | Large orgs | + SSO, compliance, dedicated support |

**Rationale:**
- $29/mo is 3x Copilot but provides unique value no one else has
- Professional tier captures heavy Claude Code users hitting rate limits
- Team tier matches GitHub Copilot Enterprise, familiar to procurement
- Enterprise captures organizations needing compliance

### Option B: Freemium with Usage Caps

| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 100 checkpoints/month, no multi-chat |
| Pro | $19/month | 1,000 checkpoints, 3 parallel chats |
| Max | $49/month | Unlimited checkpoints, unlimited parallel |
| Team | $29/user/month | Team features, pooled limits |

**Rationale:** Lower barrier drives adoption, upgrade path clear.

**Risk:** Free tier attracts non-paying users who dilute community/support.

### Option C: Pure Enterprise Play

Skip consumer entirely. Target:
- AI-first development teams (50+ engineers)
- Enterprises building internal AI tooling
- Consulting firms with AI practices

**Pricing:** $99-199/user/month

**Rationale:** Higher price, smaller market, bigger deals.

**Risk:** Long sales cycles, requires enterprise sales function.

---

## Recommended Strategy: Option A with Trial

1. **14-day free trial** - Full Professional features
2. **Starter at $29/month** - Core crash prevention value
3. **Professional at $49/month** - Power user features
4. **Annual discount** - 2 months free ($290/year, $490/year)

### Why This Works

1. **No free tier drama** - Avoids Cursor's June 2025 pricing crisis
2. **Clear value ladder** - Features justify price differences
3. **Trial proves value** - Users experience crash prevention before paying
4. **Annual locks in** - Reduces churn, improves predictability

---

## Feature-to-Tier Mapping

| Feature | Starter | Professional | Team |
|---------|---------|--------------|------|
| Crash prediction & prevention | ✓ | ✓ | ✓ |
| Automatic checkpointing | ✓ | ✓ | ✓ |
| Instant session resume | ✓ | ✓ | ✓ |
| Session history (7 days) | ✓ | - | - |
| Session history (30 days) | - | ✓ | ✓ |
| Session history (unlimited) | - | - | ✓ |
| Multi-chat coordination | - | ✓ | ✓ |
| Parallel session limit | 1 | 5 | Unlimited |
| Autonomous mode | - | ✓ | ✓ |
| Self-evolution engine | - | ✓ | ✓ |
| Shared team context | - | - | ✓ |
| Usage analytics | Basic | Advanced | Team-wide |
| Priority support | - | Email | Chat + Call |
| SSO integration | - | - | ✓ |

---

## Go-to-Market Strategy

### Phase 1: Founder-Led Sales (Months 1-3)

**Target:** Claude Code power users on Twitter/X, Reddit, Hacker News

**Message:** "Lost 2 hours of work when Claude crashed? Never again."

**Channels:**
- Twitter threads about crash recovery
- Reddit posts in r/ClaudeDev, r/singularity
- Hacker News Show HN
- YouTube demo video

**Goal:** 100 paying users at $29/month = $2,900 MRR

### Phase 2: Content Marketing (Months 3-6)

**Target:** Broader developer audience

**Content:**
- "The Hidden Cost of AI Assistant Crashes" (blog post)
- "How to 10x Your Claude Productivity" (tutorial)
- "Building Autonomous AI Workflows" (technical deep dive)

**Channels:**
- SEO-optimized blog
- Dev.to, Hashnode cross-posts
- Newsletter (weekly tips)

**Goal:** 500 paying users = $14,500 MRR (mix of tiers)

### Phase 3: Enterprise Outreach (Months 6-12)

**Target:** AI-forward engineering organizations

**Approach:**
- Case studies from Phase 1/2 users
- ROI calculator showing time saved
- Enterprise pilot programs

**Goal:** 5 enterprise customers at $39/user × 20 users = $3,900/month each

---

## Revenue Projections

### Conservative Scenario

| Month | Users | MRR | Notes |
|-------|-------|-----|-------|
| 3 | 100 | $2,900 | Early adopters |
| 6 | 300 | $10,000 | Word of mouth |
| 12 | 1,000 | $35,000 | Content + enterprise |
| 18 | 2,500 | $90,000 | Market establishment |
| 24 | 5,000 | $180,000 | Expansion |

**Year 1 Total:** ~$150,000 ARR
**Year 2 Total:** ~$1.5M ARR

### Optimistic Scenario (Viral/Category Winner)

| Month | Users | MRR |
|-------|-------|-----|
| 6 | 1,000 | $35,000 |
| 12 | 5,000 | $175,000 |
| 18 | 15,000 | $500,000 |
| 24 | 40,000 | $1.4M |

**Year 2 Total:** ~$12M ARR

---

## Open Source vs Commercial Decision

### Arguments for Open Source Core

1. **Trust** - Developers can audit crash handling code
2. **Distribution** - GitHub stars → organic growth
3. **Contributions** - Community improves product
4. **Enterprise sales** - "We use the open source, now need enterprise features"

### Arguments Against Open Source

1. **Competition** - Anthropic/GitHub could fork and bundle
2. **Value capture** - Harder to charge when code is free
3. **Support burden** - Free users expect help

### Recommended Approach: Open Core

| Component | License |
|-----------|---------|
| Crash detection signals | MIT (open) |
| Checkpoint protocol | MIT (open) |
| MCP server base | MIT (open) |
| Multi-chat coordination | Proprietary |
| Self-evolution engine | Proprietary |
| Autonomous mode | Proprietary |
| Analytics dashboard | Proprietary |

**Rationale:** 
- Open source crash prevention builds trust and adoption
- Proprietary coordination/autonomy features capture value
- Clear line: "basic recovery free, superpowers paid"

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Anthropic builds native persistence | Medium | High | Move fast, establish user base, add features they won't |
| Cursor/Copilot bundle similar features | Medium | Medium | Focus on depth (they'll do shallow integration) |
| Market doesn't value crash prevention | Low | High | Strong user research shows this is #1 pain point |
| Rate limiting prevents multi-chat | Low | Medium | Architecture designed for graceful degradation |
| Open source fork gains traction | Medium | Medium | Stay ahead with proprietary features, community |

---

## Success Metrics

### Month 3 Milestones
- [ ] 100 paying customers
- [ ] $2,900 MRR
- [ ] NPS > 50
- [ ] < 5% monthly churn

### Month 6 Milestones
- [ ] 300 paying customers
- [ ] $10,000 MRR
- [ ] First enterprise pilot
- [ ] 1,000 GitHub stars (if open core)

### Month 12 Milestones
- [ ] 1,000 paying customers
- [ ] $35,000 MRR
- [ ] 3+ enterprise customers
- [ ] Break-even on development costs

---

## Conclusion

SHIM enters a market where competitors are racing to add features while ignoring infrastructure stability. By focusing on the foundational problem—that AI sessions crash and context is lost—SHIM captures value that no one else is addressing.

The recommended approach:
1. **Price at $29-49/month** (premium but justified)
2. **Open core model** (trust + distribution)
3. **Founder-led sales** → **Content marketing** → **Enterprise**
4. **Focus on crash prevention first** (clearest value prop)

The market timing is excellent: Sourcegraph just killed Cody Free/Pro, Cursor had a pricing crisis, and Claude Code users are frustrated with rate limits and crashes. SHIM solves the problem everyone else is ignoring.

---

*Last Updated: January 9, 2026*
