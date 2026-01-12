#!/usr/bin/env node
/**
 * SHIM MCP Server - Claude+ Infrastructure Layer
 * 
 * Provides invisible background infrastructure for:
 * - Auto-checkpointing (every 3-5 tool calls)
 * - Crash recovery (automatic detection)
 * - Signal monitoring (preemptive crash prevention)
 * - Code analysis (on-demand)
 * - Self-evolution (A/B testing, auto-deployment)
 * 
 * Philosophy: Complete invisibility. Zero user intervention.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { AutoCheckpointHandler } from './handlers/auto-checkpoint.js';
import { RecoveryCheckHandler } from './handlers/recovery-check.js';
import { SignalMonitorHandler } from './handlers/signal-monitor.js';
import { CodeAnalysisHandler } from './handlers/code-analysis.js';
import { SessionStatusHandler } from './handlers/session-status.js';
import { ForceCheckpointHandler } from './handlers/force-checkpoint.js';
import { IHandler } from './handlers/base-handler.js';

/**
 * SHIM MCP Server
 * 
 * Runs as background process, auto-loaded by Claude Desktop.
 * All operations silent unless user-facing value exists.
 */
class ShimMCPServer {
  private server: Server;
  private handlers: Map<string, IHandler>;

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

    // Initialize all handlers
    this.handlers = new Map([
      ['shim_auto_checkpoint', new AutoCheckpointHandler()],
      ['shim_check_recovery', new RecoveryCheckHandler()],
      ['shim_monitor_signals', new SignalMonitorHandler()],
      ['shim_analyze_code', new CodeAnalysisHandler()],
      ['shim_session_status', new SessionStatusHandler()],
      ['shim_force_checkpoint', new ForceCheckpointHandler()],
    ]);

    this.setupHandlers();
  }

  /**
   * Define all MCP tools
   */
  private getToolDefinitions(): Tool[] {
    return [
      {
        name: 'shim_auto_checkpoint',
        description: 'Automatically save session state (called by Claude every 3-5 tool calls). Silent operation - no user-facing output.',
        inputSchema: {
          type: 'object',
          properties: {
            current_task: {
              type: 'string',
              description: 'Brief description of current task being worked on',
            },
            progress: {
              type: 'number',
              description: 'Progress from 0.0 to 1.0',
              minimum: 0,
              maximum: 1,
            },
            decisions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key decisions made during this session',
            },
            active_files: {
              type: 'array',
              items: { type: 'string' },
              description: 'Files currently being worked on (absolute paths)',
            },
            next_steps: {
              type: 'array',
              items: { type: 'string' },
              description: 'What needs to be done next',
            },
          },
          required: ['current_task', 'progress'],
        },
      },
      {
        name: 'shim_check_recovery',
        description: 'Check for incomplete previous session at startup. Shows recovery prompt to user if detected.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'shim_monitor_signals',
        description: 'Monitor crash warning signals during session. Triggers preemptive checkpoint if risk is high.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'shim_analyze_code',
        description: 'Analyze code quality in a directory. Returns top improvement opportunities ranked by ROI.',
        inputSchema: {
          type: 'object',
          properties: {
            directory: {
              type: 'string',
              description: 'Absolute path to directory to analyze',
            },
            max_opportunities: {
              type: 'number',
              description: 'Maximum number of opportunities to return (default: 10)',
              minimum: 1,
              maximum: 50,
            },
          },
          required: ['directory'],
        },
      },
      {
        name: 'shim_session_status',
        description: 'Show current SHIM status including checkpoint count, session duration, and recovery availability.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'shim_force_checkpoint',
        description: 'Manually create a checkpoint. Use when user explicitly asks to "save checkpoint" or before risky operations.',
        inputSchema: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'Reason for manual checkpoint (for debugging/logging)',
            },
          },
        },
      },
    ];
  }

  /**
   * Set up request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getToolDefinitions(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Route to appropriate handler
        const handler = this.handlers.get(name);
        if (!handler) {
          throw new Error(`Unknown tool: ${name}`);
        }

        // Execute handler
        const result = await handler.execute(args || {});

        // Return result
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        // Log error to stderr (not visible to user in Claude)
        console.error(`[SHIM MCP] Error in ${name}:`, error);

        // Return error response
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
                tool: name,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log to stderr (not visible in Claude)
    console.error('[SHIM MCP] Server started successfully');
    console.error('[SHIM MCP] Version: 1.0.0');
    console.error('[SHIM MCP] Tools available:', Array.from(this.handlers.keys()));
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    const server = new ShimMCPServer();
    await server.start();
  } catch (error) {
    console.error('[SHIM MCP] Fatal error:', error);
    process.exit(1);
  }
}

// Start server
main().catch((error) => {
  console.error('[SHIM MCP] Unhandled error:', error);
  process.exit(1);
});
