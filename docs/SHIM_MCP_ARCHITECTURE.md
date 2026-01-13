# SHIM MCP ARCHITECTURE - v5.0 (LEAN-OUT)

**Version:** 5.0  
**Updated:** January 12, 2026  
**Server Size:** 14.5kb (was 2MB in v2.0)  
**Tools:** 6 core (was 98 in v2.0)

---

## 🎯 MCP SERVER ROLE

```yaml
role: "Thin stdio coordinator"
responsibility: "Route tool calls to appropriate systems"
not_responsible:
  - computation: "❌ No heavy processing"
  - analysis: "❌ No AST parsing"
  - transformation: "❌ No code generation"
  - ml_inference: "❌ No model execution"

principle: "Coordinate, don't compute"
```

---

## 📊 v2.0 vs v5.0 COMPARISON

### v2.0 (Rejected - Violated LEAN-OUT)

```yaml
approach: "All-in-one server with heavy services"
tools: 98
bundle_size: "~2MB"
dependencies:
  - typescript: "TypeScript compiler runtime"
  - babel: "AST transformation"
  - ml_libs: "ML inference"
custom_code: "~8000 LOC"
result: "❌ Crashed (ERR_MODULE_NOT_FOUND: typescript)"
```

### v5.0 (Approved - LEAN-OUT Compliant)

```yaml
approach: "Thin coordinator + existing tools"
tools: 6 core + 2 Phase 2 additions
bundle_size: "14.5kb"
dependencies:
  - "@modelcontextprotocol/sdk": "MCP protocol"
  - "zod": "Validation"
  - "ioredis": "Redis client (Phase 2)"
custom_code: "311-511 LOC"
result: "✅ Works, maintainable"
```

---

## 🔧 CORE TOOLS (6)

### 1. shim_auto_checkpoint
**Purpose:** Auto-save session state  
**Implementation:** CheckpointService  
**Code:** Domain logic (~100 LOC)

```typescript
case 'shim_auto_checkpoint': {
  const context = input.context;
  const checkpoint = await checkpointService.save(context);
  return { success: true, checkpointId: checkpoint.id };
}
```

### 2. shim_check_recovery
**Purpose:** Detect incomplete sessions  
**Implementation:** RecoveryService  
**Code:** Domain logic (~80 LOC)

```typescript
case 'shim_check_recovery': {
  const incomplete = await recoveryService.detect();
  if (incomplete) {
    return { 
      needsRecovery: true,
      checkpoint: incomplete.lastCheckpoint 
    };
  }
  return { needsRecovery: false };
}
```

### 3. shim_monitor_signals
**Purpose:** Collect crash warning signals  
**Implementation:** SignalCollector  
**Code:** Domain logic (~80 LOC)

```typescript
case 'shim_monitor_signals': {
  const signals = await signalService.collect();
  const risk = calculateRisk(signals);
  return { signals, risk, recommendation: getRecommendation(risk) };
}
```

### 4. shim_session_status
**Purpose:** Report current session state  
**Implementation:** SessionService  
**Code:** Simple query (~30 LOC)

```typescript
case 'shim_session_status': {
  const status = await sessionService.getStatus();
  return status;
}
```

### 5. shim_force_checkpoint
**Purpose:** Manual checkpoint trigger  
**Implementation:** CheckpointService  
**Code:** Simple wrapper (~20 LOC)

```typescript
case 'shim_force_checkpoint': {
  const checkpoint = await checkpointService.save(input.context, true);
  return { success: true, checkpointId: checkpoint.id };
}
```

### 6. shim_clear_state
**Purpose:** Clear checkpoint data  
**Implementation:** CheckpointService  
**Code:** Simple delete (~20 LOC)

```typescript
case 'shim_clear_state': {
  await checkpointService.clear();
  return { success: true };
}
```

---

## 🚧 PHASE 2 ADDITIONS (2 tools)

### 7. shim_sync_state
**Purpose:** Sync state across chat instances  
**Implementation:** StateSynchronizer (Redis wrapper)  
**Code:** Thin wrapper (~50 LOC)

```typescript
case 'shim_sync_state': {
  await stateSynchronizer.sync(input.state);
  return { success: true };
}
```

### 8. shim_coordinate_task
**Purpose:** Distribute tasks via BullMQ  
**Implementation:** BullMQ wrapper  
**Code:** Thin wrapper (~50 LOC)

```typescript
case 'shim_coordinate_task': {
  const job = await taskQueue.add(input.task);
  return { success: true, jobId: job.id };
}
```

---

## 📅 FUTURE TOOLS (Phases 4-6)

### Phase 4: Tool Composition

**shim_analyze_code** - Spawn ESLint, TSC, etc.
```typescript
case 'shim_analyze_code': {
  const results = await Promise.all([
    exec('eslint --format json'),
    exec('tsc --noEmit'),
    exec('complexity-report --format json')
  ]);
  return aggregateResults(results);  // Optional ~50 LOC
}
```

**shim_refactor_code** - Spawn jscodeshift
```typescript
case 'shim_refactor_code': {
  return exec(`jscodeshift -t ${transform} ${path}`);
}
```

**shim_get_metrics** - Query Grafana API
```typescript
case 'shim_get_metrics': {
  return fetch('http://localhost:3000/api/metrics');
}
```

### Phase 6: Kaizen (v6.0)

**shim_run_experiment** - BullMQ scheduled job
```typescript
case 'shim_run_experiment': {
  const job = await experimentQueue.add('experiment', data, {
    repeat: { cron: '0 */4 * * *' }
  });
  return { success: true, jobId: job.id };
}
```

---

## 🏗️ ARCHITECTURE PATTERN

### Thin Coordinator Pattern

```
┌─────────────────────────────────────┐
│         MCP Server (stdio)          │
│   6-8 tools │ 14.5kb │ 311-511 LOC  │
└───────────┬─────────────────────────┘
            │
    ┌───────┼───────┬──────────┬──────────┐
    │       │       │          │          │
    ▼       ▼       ▼          ▼          ▼
┌────────┐ ┌─────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Checkpoint│ │Redis│ │ spawn  │ │ fetch  │ │BullMQ  │
│Service  │ │     │ │ eslint │ │ Grafana│ │        │
└────────┘ └─────┘ └────────┘ └────────┘ └────────┘
 Domain     Infra    Existing   Existing   Existing
 Logic      Wrapper  Tool       Tool       Tool
```

### What MCP Server Does ✅
- Routes tool calls
- Validates inputs (zod)
- Coordinates services
- Returns results

### What MCP Server Doesn't Do ❌
- Heavy computation
- AST parsing
- Code transformation
- ML inference
- Dashboard rendering

---

## 📦 BUNDLE ANALYSIS

### Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "Protocol implementation",
    "zod": "Input validation",
    "ioredis": "Redis client (Phase 2)"
  },
  "devDependencies": {
    "esbuild": "Bundler",
    "typescript": "Build only"
  }
}
```

### Build Configuration

```javascript
// esbuild.config.js
{
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  external: [], // Bundle everything except node built-ins
  minify: true,
  outfile: 'dist/index.js'
}
```

### Result
- Input: 311-511 LOC TypeScript
- Output: 14.5kb JavaScript bundle
- Startup: ~50ms
- Memory: ~10MB

---

## 🔄 REQUEST/RESPONSE FLOW

### Tool Invocation

```
1. Claude Desktop
   ↓ (stdio/MCP protocol)
2. MCP Server receives tool call
   ↓ (validate with zod)
3. Route to appropriate handler
   ↓
4. Execute handler
   ├─ Domain logic (if core)
   ├─ Redis operation (if Phase 2)
   ├─ Spawn existing tool (if Phase 4)
   └─ Fetch API (if Phase 4)
   ↓
5. Return result
   ↓ (stdio/MCP protocol)
6. Claude Desktop
```

### Example: shim_auto_checkpoint

```typescript
// 1. Receive
const request = {
  method: 'tools/call',
  params: {
    name: 'shim_auto_checkpoint',
    arguments: { context: { tokenCount: 145000, ... } }
  }
};

// 2. Validate
const input = CheckpointInputSchema.parse(request.params.arguments);

// 3. Execute
const checkpoint = await checkpointService.save(input.context);

// 4. Return
return {
  content: [{
    type: 'text',
    text: JSON.stringify({ success: true, checkpointId: checkpoint.id })
  }]
};
```

---

## 🧪 TESTING STRATEGY

### Unit Tests
- Each tool handler
- Input validation
- Error handling
- Edge cases

### Integration Tests
- MCP protocol compliance
- stdio communication
- Service integration

### E2E Tests
- Claude Desktop integration
- Full workflow scenarios
- Crash recovery flows

---

## 🔐 SECURITY

### Input Validation
```typescript
// zod schemas for all inputs
const CheckpointInputSchema = z.object({
  context: z.object({
    tokenCount: z.number(),
    timeSinceCheckpoint: z.number(),
    memoryUsage: z.number()
  })
});
```

### Error Handling
```typescript
try {
  const result = await handler(input);
  return success(result);
} catch (error) {
  return failure(error.message);
}
```

### Rate Limiting
- Not needed (local process)
- Claude Desktop controls invocation rate

---

## 📈 PERFORMANCE

### Startup Time
- v2.0: ~500ms (heavy dependencies)
- v5.0: ~50ms (minimal dependencies)
- **Improvement:** 10x faster

### Memory Usage
- v2.0: ~150MB (TypeScript compiler loaded)
- v5.0: ~10MB (minimal footprint)
- **Improvement:** 15x less

### Tool Invocation
- Target: <2s per tool call
- Actual: <100ms for core tools
- **Result:** ✅ Well within target

---

## 🚀 DEPLOYMENT

### Claude Desktop Integration

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "shim": {
      "command": "node",
      "args": ["D:\\SHIM\\mcp-server\\dist\\index.js"]
    }
  }
}
```

### Health Check

```bash
# Test server directly
node D:\SHIM\mcp-server\dist\index.js

# Should output MCP protocol handshake
# and stay running (stdio mode)
```

---

## 📚 RELATED DOCUMENTS

- `ARCHITECTURE.md` - Overall system architecture
- `ROADMAP.md` - Project phases and timeline
- `CLAUDE_INSTRUCTIONS_PROJECT.md` - Development guide
- `MCP_LEAN_OUT_REDESIGN.md` - v2→v5 evolution

---

**Version:** 5.0 (LEAN-OUT Architecture)  
**Bundle Size:** 14.5kb  
**Tools:** 6 core + 2 Phase 2  
**Principle:** Coordinate, Don't Compute  
**Updated:** January 12, 2026
