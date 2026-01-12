#!/usr/bin/env node
/**
 * SHIM MCP Server - Claude+ Infrastructure Layer
 * 
 * Provides automatic crash prevention and intelligence augmentation
 * for ALL Claude Desktop chats.
 * 
 * Philosophy: Invisible by default, valuable when needed.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { CheckpointService } from './services/checkpoint-service.js';
import { RecoveryService } from './services/recovery-service.js';
import { SignalService } from './services/signal-service.js';
import { CodeAnalysisService } from './services/code-analysis-service.js';
import { SessionService } from './services/session-service.js';

/**
 * Initialize SHIM MCP Server
 */
class ShimMcpServer {
  private server: Server;
  private checkpoint: CheckpointService;
  private recovery: RecoveryService;
  private signals: SignalService;
  private codeAnalysis: CodeAnalysisService;
  private session: SessionService;

  constructor() {
    this.server = new Server(
      {
        name: 'shim-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize services
    this.checkpoint = new CheckpointService();
    this.recovery = new RecoveryService();
    this.signals = new SignalService();
    this.codeAnalysis = new CodeAnalysisService();
    this.session = new SessionService();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'shim_auto_checkpoint',
          description: 'Automatically save session state (called every 3-5 tool calls by Claude)',
          inputSchema: {
            type: 'object',
            properties: {
              current_task: {
                type: 'string',
                description: 'Current task description'
              },
              progress: {
                type: 'number',
                description: 'Progress percentage (0.0 to 1.0)',
                minimum: 0,
                maximum: 1
              },
              decisions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Key decisions made during session'
              },
              active_files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Files currently being worked on'
              },
              next_steps: {
                type: 'array',
                items: { type: 'string' },
                description: 'Next steps to take'
              }
            },
            required: ['current_task', 'progress']
          },
        },
        {
          name: 'shim_check_recovery',
          description: 'Check for incomplete previous session (called at session start)',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          },
        },
        {
          name: 'shim_monitor_signals',
          description: 'Monitor crash warning signals (called automatically during session)',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          },
        },
        {
          name: 'shim_analyze_code',
          description: 'Analyze code quality and suggest improvements',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Directory path to analyze'
              }
            },
            required: ['directory']
          },
        },
        {
          name: 'shim_session_status',
          description: 'Show current SHIM status',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          },
        },
        {
          name: 'shim_force_checkpoint',
          description: 'Manually force a checkpoint (called when user requests)',
          inputSchema: {
            type: 'object',
            properties: {
              reason: {
                type: 'string',
                description: 'Reason for manual checkpoint'
              }
            }
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'shim_auto_checkpoint':
            return await this.handleAutoCheckpoint(request.params.arguments);

          case 'shim_check_recovery':
            return await this.handleCheckRecovery();

          case 'shim_monitor_signals':
            return await this.handleMonitorSignals();

          case 'shim_analyze_code':
            return await this.handleAnalyzeCode(request.params.arguments);

          case 'shim_session_status':
            return await this.handleSessionStatus();

          case 'shim_force_checkpoint':
            return await this.handleForceCheckpoint(request.params.arguments);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
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
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            checkpoint_id: result.checkpointId,
            elapsed_time_ms: result.elapsedTime,
            silent: true // Indicator that this shouldn't be shown to user
          }, null, 2)
        }
      ]
    };
  }

  private async handleCheckRecovery() {
    const recovery = await this.recovery.checkRecovery();

    if (recovery.available) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              recovery_available: true,
              session_summary: recovery.summary,
              timestamp: recovery.timestamp,
              checkpoint_id: recovery.checkpointId
            }, null, 2)
          }
        ]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            recovery_available: false
          }, null, 2)
        }
      ]
    };
  }

  private async handleMonitorSignals() {
    const signals = await this.signals.monitor();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            risk_level: signals.riskLevel,
            signals_detected: signals.signals,
            warnings: signals.warnings,
            should_checkpoint: signals.riskLevel > 0.7
          }, null, 2)
        }
      ]
    };
  }

  private async handleAnalyzeCode(args: any) {
    const analysis = await this.codeAnalysis.analyze(args.directory);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            directory: args.directory,
            opportunities: analysis.opportunities,
            metrics: analysis.metrics,
            recommendations: analysis.recommendations
          }, null, 2)
        }
      ]
    };
  }

  private async handleSessionStatus() {
    const status = await this.session.getStatus();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            active: true,
            last_checkpoint: status.lastCheckpoint,
            session_duration_minutes: status.sessionDuration,
            checkpoints_saved: status.checkpointsCount,
            recovery_available: status.recoveryAvailable,
            signals: status.signals
          }, null, 2)
        }
      ]
    };
  }

  private async handleForceCheckpoint(args: any) {
    const result = await this.checkpoint.forceCheckpoint(args?.reason);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            checkpoint_id: result.checkpointId,
            state_saved: true,
            reason: args?.reason || 'Manual checkpoint requested'
          }, null, 2)
        }
      ]
    };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log to stderr (stdout is for MCP protocol)
    console.error('🚀 SHIM MCP Server running');
    console.error('📍 Data directory: D:\\SHIM\\data');
    console.error('✅ Ready for automatic crash prevention');
  }
}

// Start the server
const server = new ShimMcpServer();
server.start().catch((error) => {
  console.error('❌ Failed to start SHIM MCP server:', error);
  process.exit(1);
});
