#!/usr/bin/env node
/**
 * SHIM MCP Server - Minimal Core (LEAN-OUT Compliant)
 * 
 * Provides ONLY lightweight crash prevention infrastructure.
 * Heavy analysis moved to dedicated services.
 * 
 * Philosophy: Thin coordination layer, not analysis engine.
 * 
 * Version: 3.0 - Minimal Core (6 tools)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

// CORE SERVICES ONLY (lightweight, no heavy dependencies)
import { CheckpointService } from './services/checkpoint-service.js';
import { RecoveryService } from './services/recovery-service.js';
import { SignalService } from './services/signal-service.js';
import { SessionService } from './services/session-service.js';

/**
 * Minimal SHIM MCP Server - Core Infrastructure Only
 */
class ShimMcpServer {
  private server: Server;
  
  // Core services (lightweight)
  private checkpoint: CheckpointService;
  private recovery: RecoveryService;
  private signals: SignalService;
  private session: SessionService;

  constructor() {
    this.server = new Server(
      {
        name: 'shim-mcp',
        version: '3.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize ONLY core services
    this.checkpoint = new CheckpointService();
    this.recovery = new RecoveryService();
    this.signals = new SignalService();
    this.session = new SessionService();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools (6 core tools only)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // CORE TOOL 1: Auto Checkpoint
        {
          name: 'shim_auto_checkpoint',
          description: 'Automatically save session state (called every 3-5 tool calls by Claude)',
          inputSchema: {
            type: 'object',
            properties: {
              current_task: { type: 'string', description: 'Current task description' },
              progress: { type: 'number', description: 'Progress 0.0-1.0', minimum: 0, maximum: 1 },
              decisions: { type: 'array', items: { type: 'string' }, description: 'Key decisions made' },
              active_files: { type: 'array', items: { type: 'string' }, description: 'Files being worked on' },
              next_steps: { type: 'array', items: { type: 'string' }, description: 'Next steps' }
            },
            required: ['current_task', 'progress']
          }
        },
        
        // CORE TOOL 2: Check Recovery
        {
          name: 'shim_check_recovery',
          description: 'Check for incomplete previous session (called at session start)',
          inputSchema: { 
            type: 'object', 
            properties: {},
            additionalProperties: false 
          }
        },
        
        // CORE TOOL 3: Monitor Signals
        {
          name: 'shim_monitor_signals',
          description: 'Monitor crash warning signals (called automatically)',
          inputSchema: { 
            type: 'object', 
            properties: {},
            additionalProperties: false 
          }
        },
        
        // CORE TOOL 4: Session Status
        {
          name: 'shim_session_status',
          description: 'Show current SHIM status',
          inputSchema: { 
            type: 'object', 
            properties: {},
            additionalProperties: false 
          }
        },
        
        // CORE TOOL 5: Force Checkpoint
        {
          name: 'shim_force_checkpoint',
          description: 'Manually force a checkpoint',
          inputSchema: {
            type: 'object',
            properties: {
              reason: { type: 'string', description: 'Reason for checkpoint' }
            }
          }
        },
        
        // CORE TOOL 6: Clear State
        {
          name: 'shim_clear_state',
          description: 'Clear all checkpoint state (use with caution)',
          inputSchema: { 
            type: 'object', 
            properties: {},
            additionalProperties: false 
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'shim_auto_checkpoint':
            return await this.handleAutoCheckpoint(args);
          
          case 'shim_check_recovery':
            return await this.handleCheckRecovery();
          
          case 'shim_monitor_signals':
            return await this.handleMonitorSignals();
          
          case 'shim_session_status':
            return await this.handleSessionStatus();
          
          case 'shim_force_checkpoint':
            return await this.handleForceCheckpoint(args);
          
          case 'shim_clear_state':
            return await this.handleClearState();
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) throw error;
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async handleAutoCheckpoint(args: any) {
    const result = await this.checkpoint.createCheckpoint({
      currentTask: args.current_task,
      progress: args.progress,
      decisions: args.decisions || [],
      activeFiles: args.active_files || [],
      nextSteps: args.next_steps || []
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          checkpoint_id: result.checkpointId,
          elapsed_ms: result.elapsedTime,
          message: '✅ Checkpoint saved successfully'
        }, null, 2)
      }]
    };
  }

  private async handleCheckRecovery() {
    const result = await this.recovery.checkForIncomplete();
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  private async handleMonitorSignals() {
    const signals = await this.signals.collectSignals();
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(signals, null, 2)
      }]
    };
  }

  private async handleSessionStatus() {
    const status = await this.session.getStatus();
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(status, null, 2)
      }]
    };
  }

  private async handleForceCheckpoint(args: any) {
    const result = await this.checkpoint.createCheckpoint({
      currentTask: args.reason || 'Manual checkpoint',
      progress: 0.5,
      decisions: ['Manual checkpoint requested'],
      activeFiles: [],
      nextSteps: []
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          checkpoint_id: result.checkpointId,
          message: '✅ Manual checkpoint created'
        }, null, 2)
      }]
    };
  }

  private async handleClearState() {
    // Clear checkpoint state
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const SHIM_ROOT = path.join(__dirname, '..', '..', '..');
    const DATA_DIR = path.join(SHIM_ROOT, 'data', 'checkpoints');
    
    try {
      await fs.rm(DATA_DIR, { recursive: true, force: true });
      await fs.mkdir(DATA_DIR, { recursive: true });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: '✅ All checkpoint state cleared'
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          }, null, 2)
        }]
      };
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('✅ SHIM MCP Server v3.0 (Minimal Core) - Ready');
    console.error('📦 Tools: 6 core infrastructure tools');
    console.error('🎯 Philosophy: Thin coordination layer');
  }
}

// Start server
const server = new ShimMcpServer();
server.run().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
