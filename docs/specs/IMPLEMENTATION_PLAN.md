# SHIM Phase 1: Implementation Plan

**Component:** Crash Prevention System  
**Duration:** 4-6 weeks  
**Start Date:** TBD  
**Team:** Solo developer

---

## Week 1-2: Observable Signals & Metrics (10 days)

### Days 1-2: Project Setup
- [x] Initialize git repository
- [ ] Install dependencies (tiktoken, sqlite3, uuid)
- [ ] Configure TypeScript project
- [ ] Set up test framework (Jest)
- [ ] Create directory structure

### Days 3-4: SignalCollector Implementation
- [ ] Implement token counting with tiktoken
- [ ] Track message and tool call counters
- [ ] Implement latency tracking (rolling windows)
- [ ] Calculate trend detection (linear regression)

### Day 5: Threshold Configuration
- [ ] Define warning/danger zone thresholds
- [ ] Implement risk assessment algorithm
- [ ] Test threshold crossing detection

### Days 6-7: Signal History Tracking
- [ ] Create signal_history table
- [ ] Implement periodic signal snapshots
- [ ] Test query performance

### Days 8-9: Metrics Dashboard (Optional)
- [ ] Create simple CLI dashboard
- [ ] Real-time signal display
- [ ] Historical trend visualization

### Day 10: Integration Testing
- [ ] Test signal collection under load
- [ ] Verify crash risk calculation
- [ ] Performance benchmarks

---

## Week 3-4: Checkpoint System (10 days)

### Days 11-12: Checkpoint Data Model
- [ ] Implement Checkpoint interface
- [ ] Create serialization functions
- [ ] Implement validation logic
- [ ] Test size constraints

### Days 13-14: CheckpointManager
- [ ] Implement createCheckpoint()
- [ ] Capture conversation state
- [ ] Capture file state
- [ ] Capture tool state

### Day 15: Database Integration
- [ ] Create checkpoints table
- [ ] Implement CheckpointRepository
- [ ] Test CRUD operations

### Days 16-17: CheckpointTriggerSystem
- [ ] Implement trigger evaluation
- [ ] Tool call interval trigger
- [ ] Time interval trigger
- [ ] Danger zone trigger

### Day 18: Compression Implementation
- [ ] Implement gzip compression
- [ ] Test compression ratios
- [ ] Optimize compression level

### Days 19-20: Cleanup & Optimization
- [ ] Implement cleanup policy
- [ ] Performance optimization
- [ ] Load testing

---

## Week 5-6: Resume Protocol (10 days)

### Days 21-22: ResumeDetector
- [ ] Implement checkResumeNeeded()
- [ ] Detect incomplete work
- [ ] Infer interruption reason
- [ ] Calculate resume confidence

### Days 23-24: ResumePromptGenerator
- [ ] Generate situation summary
- [ ] Format progress information
- [ ] Create structured prompt
- [ ] Test prompt quality

### Day 25: Resume Event Logging
- [ ] Create resume_events table
- [ ] Track recovery attempts
- [ ] Calculate fidelity scores

### Days 26-27: MCP Server
- [ ] Implement shim_get_crash_risk
- [ ] Implement shim_checkpoint
- [ ] Implement shim_check_resume
- [ ] Implement shim_list_checkpoints

### Day 28: KERNL Integration
- [ ] Integrate with KERNL database
- [ ] Share session management
- [ ] Test interoperability

### Days 29-30: End-to-End Testing
- [ ] Crash simulation tests
- [ ] Recovery validation
- [ ] Performance verification
- [ ] Bug fixes and polish

---

## Dependencies

**Required:**
- Node.js >= 18.0.0
- TypeScript 5.3+
- KERNL MCP Server
- Desktop Commander

**Optional:**
- Redis (for Phase 2 prep)

---

## Definition of Done

- [ ] All checkpoints created automatically
- [ ] Resume detection works reliably
- [ ] Context restored with >90% fidelity
- [ ] Recovery time <2 minutes
- [ ] All unit tests passing (>80% coverage)
- [ ] All integration tests passing
- [ ] Performance metrics met
- [ ] Documentation complete

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Token estimation inaccuracy | Use tiktoken + safety margins |
| Checkpoint size bloat | Aggressive truncation + compression |
| Database corruption | Regular backups + integrity checks |
| Performance degradation | Profiling + optimization passes |
| KERNL compatibility issues | Early integration testing |

---

## Success Metrics

- Checkpoint creation: <100ms (target)
- Crash detection: >90% accuracy
- Context restoration: >90% fidelity
- Zero data loss
- Overhead: <5%

---

*End of Implementation Plan*