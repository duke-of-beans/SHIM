#!/usr/bin/env node
/**
 * SHIM MCP Server - Claude+ Infrastructure Layer
 * 
 * Provides automatic crash prevention and intelligence augmentation
 * for ALL Claude Desktop chats.
 * 
 * Philosophy: Invisible by default, valuable when needed.
 * 
 * Version: 2.0 - Complete API Surface (58 tools)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

// Original services (6 tools)
import { CheckpointService } from './services/checkpoint-service.js';
import { RecoveryService } from './services/recovery-service.js';
import { SignalService } from './services/signal-service.js';
import { CodeAnalysisService } from './services/code-analysis-service.js';
import { SessionService } from './services/session-service.js';

// New services (52 additional tools)
import { AnalyticsService } from './services/AnalyticsService.js';
import { EvolutionService } from './services/EvolutionService.js';
import { AutonomyService } from './services/AutonomyService.js';
import { CoordinationService } from './services/CoordinationService.js';

/**
 * Initialize SHIM MCP Server
 */
class ShimMcpServer {
  private server: Server;
  
  // Original services
  private checkpoint: CheckpointService;
  private recovery: RecoveryService;
  private signals: SignalService;
  private codeAnalysis: CodeAnalysisService;
  private session: SessionService;
  
  // New services
  private analytics: AnalyticsService;
  private evolution: EvolutionService;
  private autonomy: AutonomyService;
  private coordination: CoordinationService;

  constructor() {
    this.server = new Server(
      {
        name: 'shim-mcp',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize original services
    this.checkpoint = new CheckpointService();
    this.recovery = new RecoveryService();
    this.signals = new SignalService();
    this.codeAnalysis = new CodeAnalysisService();
    this.session = new SessionService();
    
    // Initialize new services
    this.analytics = new AnalyticsService();
    this.evolution = new EvolutionService();
    this.autonomy = new AutonomyService();
    this.coordination = new CoordinationService();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools (58 total: 6 core + 52 intelligence)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // CORE TOOLS (6) - Crash Prevention
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
        {
          name: 'shim_check_recovery',
          description: 'Check for incomplete previous session (called at session start)',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_monitor_signals',
          description: 'Monitor crash warning signals (called automatically)',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_analyze_code',
          description: 'Analyze code quality and suggest improvements',
          inputSchema: {
            type: 'object',
            properties: {
              directory: { type: 'string', description: 'Directory path to analyze' }
            },
            required: ['directory']
          }
        },
        {
          name: 'shim_session_status',
          description: 'Show current SHIM status',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
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

        // ANALYTICS TOOLS (14)
        {
          name: 'shim_start_auto_experiments',
          description: 'Start autonomous experimentation (Kaizen loop)',
          inputSchema: {
            type: 'object',
            properties: {
              config: { type: 'object', description: 'Optional engine configuration' }
            }
          }
        },
        {
          name: 'shim_stop_auto_experiments',
          description: 'Stop autonomous experimentation',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_get_experiment_status',
          description: 'Get current experiment status',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_get_improvement_report',
          description: 'Get improvement metrics and history',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_detect_opportunities',
          description: 'Detect improvement opportunities from metrics',
          inputSchema: {
            type: 'object',
            properties: {
              metrics_data: { type: 'object', description: 'Metrics to analyze' }
            },
            required: ['metrics_data']
          }
        },
        {
          name: 'shim_get_opportunity_history',
          description: 'Get historical opportunities detected',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_validate_safety',
          description: 'Validate safety bounds for a change',
          inputSchema: {
            type: 'object',
            properties: {
              change: { type: 'object', description: 'Proposed change' },
              bounds: { type: 'object', description: 'Optional safety bounds override' }
            },
            required: ['change']
          }
        },
        {
          name: 'shim_get_safety_config',
          description: 'Get current safety configuration',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_collect_metrics',
          description: 'Collect Prometheus metrics',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_export_metrics',
          description: 'Export metrics in specified format',
          inputSchema: {
            type: 'object',
            properties: {
              format: { type: 'string', enum: ['json', 'prometheus'], description: 'Export format' }
            },
            required: ['format']
          }
        },
        {
          name: 'shim_get_metrics_summary',
          description: 'Get metrics summary',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_create_experiment',
          description: 'Create A/B experiment in Statsig',
          inputSchema: {
            type: 'object',
            properties: {
              config: { type: 'object', description: 'Experiment configuration' }
            },
            required: ['config']
          }
        },
        {
          name: 'shim_get_experiment_results',
          description: 'Get Statsig experiment results',
          inputSchema: {
            type: 'object',
            properties: {
              experiment_id: { type: 'string', description: 'Experiment ID' }
            },
            required: ['experiment_id']
          }
        },
        {
          name: 'shim_get_feature_flags',
          description: 'Get feature flags from Statsig',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },

        // EVOLUTION TOOLS (20)
        {
          name: 'shim_deep_analyze',
          description: 'Deep AST analysis with configurable depth',
          inputSchema: {
            type: 'object',
            properties: {
              directory: { type: 'string', description: 'Directory to analyze' },
              depth: { type: 'number', description: 'Analysis depth (default: 3)' }
            },
            required: ['directory']
          }
        },
        {
          name: 'shim_analyze_patterns',
          description: 'Pattern analysis across codebase',
          inputSchema: {
            type: 'object',
            properties: {
              directory: { type: 'string', description: 'Directory to analyze' }
            },
            required: ['directory']
          }
        },
        {
          name: 'shim_ast_parse',
          description: 'Parse AST structure for a file',
          inputSchema: {
            type: 'object',
            properties: {
              file_path: { type: 'string', description: 'File to parse' }
            },
            required: ['file_path']
          }
        },
        {
          name: 'shim_generate_improvement',
          description: 'Generate code improvement from opportunity',
          inputSchema: {
            type: 'object',
            properties: {
              opportunity: { type: 'object', description: 'Improvement opportunity' }
            },
            required: ['opportunity']
          }
        },
        {
          name: 'shim_preview_change',
          description: 'Preview code change before deployment',
          inputSchema: {
            type: 'object',
            properties: {
              improvement_id: { type: 'string', description: 'Improvement ID' }
            },
            required: ['improvement_id']
          }
        },
        {
          name: 'shim_deploy_improvement',
          description: 'Deploy code improvement',
          inputSchema: {
            type: 'object',
            properties: {
              improvement_id: { type: 'string', description: 'Improvement ID' }
            },
            required: ['improvement_id']
          }
        },
        {
          name: 'shim_rollback_deployment',
          description: 'Rollback deployment',
          inputSchema: {
            type: 'object',
            properties: {
              deployment_id: { type: 'string', description: 'Deployment ID' }
            },
            required: ['deployment_id']
          }
        },
        {
          name: 'shim_get_deployment_history',
          description: 'Get deployment history',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_start_evolution',
          description: 'Start evolution cycle',
          inputSchema: {
            type: 'object',
            properties: {
              config: { type: 'object', description: 'Optional evolution config' }
            }
          }
        },
        {
          name: 'shim_get_evolution_status',
          description: 'Get evolution status',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_generate_experiment',
          description: 'Generate experiment from opportunity',
          inputSchema: {
            type: 'object',
            properties: {
              opportunity: { type: 'object', description: 'Opportunity to experiment' }
            },
            required: ['opportunity']
          }
        },
        {
          name: 'shim_list_experiments',
          description: 'List all experiments',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_identify_improvements',
          description: 'Identify all improvements in directory',
          inputSchema: {
            type: 'object',
            properties: {
              directory: { type: 'string', description: 'Directory to analyze' }
            },
            required: ['directory']
          }
        },
        {
          name: 'shim_prioritize_improvements',
          description: 'Prioritize improvements by ROI',
          inputSchema: {
            type: 'object',
            properties: {
              improvements: { type: 'array', description: 'Improvements to prioritize' }
            },
            required: ['improvements']
          }
        },
        {
          name: 'shim_profile_performance',
          description: 'Performance profiling',
          inputSchema: {
            type: 'object',
            properties: {
              directory: { type: 'string', description: 'Directory to profile' }
            },
            required: ['directory']
          }
        },
        {
          name: 'shim_get_performance_report',
          description: 'Get performance report',
          inputSchema: {
            type: 'object',
            properties: {
              profile_id: { type: 'string', description: 'Profile ID' }
            },
            required: ['profile_id']
          }
        },
        {
          name: 'shim_optimize_code',
          description: 'Apply performance optimization',
          inputSchema: {
            type: 'object',
            properties: {
              file_path: { type: 'string', description: 'File to optimize' },
              optimization: { type: 'string', description: 'Optimization to apply' }
            },
            required: ['file_path', 'optimization']
          }
        },
        {
          name: 'shim_suggest_optimizations',
          description: 'Suggest optimizations for file',
          inputSchema: {
            type: 'object',
            properties: {
              file_path: { type: 'string', description: 'File to analyze' }
            },
            required: ['file_path']
          }
        },
        {
          name: 'shim_self_deploy',
          description: 'Auto-deploy change to SHIM itself',
          inputSchema: {
            type: 'object',
            properties: {
              change: { type: 'object', description: 'Change to deploy' }
            },
            required: ['change']
          }
        },
        {
          name: 'shim_get_self_deploy_history',
          description: 'Get self-deployment history',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },

        // AUTONOMY TOOLS (15)
        {
          name: 'shim_autonomous_execute',
          description: 'Execute goal autonomously',
          inputSchema: {
            type: 'object',
            properties: {
              goal: { type: 'string', description: 'Goal to execute' },
              context: { type: 'object', description: 'Optional context' }
            },
            required: ['goal']
          }
        },
        {
          name: 'shim_get_autonomous_status',
          description: 'Get autonomous orchestrator status',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_make_decision',
          description: 'Make strategic decision',
          inputSchema: {
            type: 'object',
            properties: {
              context: { type: 'object', description: 'Decision context' },
              options: { type: 'array', description: 'Available options' }
            },
            required: ['context', 'options']
          }
        },
        {
          name: 'shim_explain_decision',
          description: 'Explain decision reasoning',
          inputSchema: {
            type: 'object',
            properties: {
              decision_id: { type: 'string', description: 'Decision ID' }
            },
            required: ['decision_id']
          }
        },
        {
          name: 'shim_recover_from_failure',
          description: 'Auto-recover from failure',
          inputSchema: {
            type: 'object',
            properties: {
              failure: { type: 'object', description: 'Failure details' }
            },
            required: ['failure']
          }
        },
        {
          name: 'shim_get_recovery_history',
          description: 'Get recovery history',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_process_feedback',
          description: 'Process user feedback',
          inputSchema: {
            type: 'object',
            properties: {
              feedback: { type: 'object', description: 'User feedback' }
            },
            required: ['feedback']
          }
        },
        {
          name: 'shim_get_feedback_insights',
          description: 'Get feedback insights',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_decompose_goal',
          description: 'Decompose goal into steps',
          inputSchema: {
            type: 'object',
            properties: {
              goal: { type: 'string', description: 'Goal to decompose' }
            },
            required: ['goal']
          }
        },
        {
          name: 'shim_get_decomposition',
          description: 'Get decomposition details',
          inputSchema: {
            type: 'object',
            properties: {
              goal_id: { type: 'string', description: 'Goal ID' }
            },
            required: ['goal_id']
          }
        },
        {
          name: 'shim_report_progress',
          description: 'Report progress on goals',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: { type: 'string', description: 'Task ID' }
            },
            required: ['task_id']
          }
        },
        {
          name: 'shim_track_progress',
          description: 'Track progress update',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: { type: 'string', description: 'Task ID' },
              update: { type: 'object', description: 'Progress update' }
            },
            required: ['task_id', 'update']
          }
        },
        {
          name: 'shim_get_progress',
          description: 'Get progress status',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: { type: 'string', description: 'Task ID' }
            },
            required: ['task_id']
          }
        },
        {
          name: 'shim_review_work',
          description: 'Quality review of work product',
          inputSchema: {
            type: 'object',
            properties: {
              work_product: { type: 'object', description: 'Work to review' }
            },
            required: ['work_product']
          }
        },
        {
          name: 'shim_get_review_criteria',
          description: 'Get review criteria',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },

        // COORDINATION TOOLS (9)
        {
          name: 'shim_register_worker',
          description: 'Register chat worker',
          inputSchema: {
            type: 'object',
            properties: {
              config: { type: 'object', description: 'Worker configuration' }
            },
            required: ['config']
          }
        },
        {
          name: 'shim_get_worker_list',
          description: 'List all registered workers',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_resolve_conflicts',
          description: 'Resolve state conflicts',
          inputSchema: {
            type: 'object',
            properties: {
              conflicts: { type: 'array', description: 'Conflicts to resolve' }
            },
            required: ['conflicts']
          }
        },
        {
          name: 'shim_get_conflict_history',
          description: 'Get conflict resolution history',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false }
        },
        {
          name: 'shim_aggregate_results',
          description: 'Aggregate multi-chat results',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: { type: 'string', description: 'Task ID' }
            },
            required: ['task_id']
          }
        },
        {
          name: 'shim_get_aggregation_status',
          description: 'Get aggregation status',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: { type: 'string', description: 'Task ID' }
            },
            required: ['task_id']
          }
        },
        {
          name: 'shim_distribute_task',
          description: 'Distribute task to workers',
          inputSchema: {
            type: 'object',
            properties: {
              task: { type: 'object', description: 'Task to distribute' },
              num_workers: { type: 'number', description: 'Number of workers' }
            },
            required: ['task', 'num_workers']
          }
        },
        {
          name: 'shim_get_distribution_status',
          description: 'Get distribution status',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: { type: 'string', description: 'Task ID' }
            },
            required: ['task_id']
          }
        },
        {
          name: 'shim_cancel_distribution',
          description: 'Cancel task distribution',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: { type: 'string', description: 'Task ID' }
            },
            required: ['task_id']
          }
        }
      ]
    }));

    // Tool call handlers will be added in subsequent chunks
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        return await this.routeToolCall(request.params.name, request.params.arguments);
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

  private async routeToolCall(toolName: string, args: any) {
    // Route tool calls to appropriate handlers
    switch (toolName) {
      // Core tools (6)
      case 'shim_auto_checkpoint': return await this.handleAutoCheckpoint(args);
      case 'shim_check_recovery': return await this.handleCheckRecovery();
      case 'shim_monitor_signals': return await this.handleMonitorSignals();
      case 'shim_analyze_code': return await this.handleAnalyzeCode(args);
      case 'shim_session_status': return await this.handleSessionStatus();
      case 'shim_force_checkpoint': return await this.handleForceCheckpoint(args);

      // Analytics tools (14)
      case 'shim_start_auto_experiments': return await this.handleStartAutoExperiments(args);
      case 'shim_stop_auto_experiments': return await this.handleStopAutoExperiments();
      case 'shim_get_experiment_status': return await this.handleGetExperimentStatus();
      case 'shim_get_improvement_report': return await this.handleGetImprovementReport();
      case 'shim_detect_opportunities': return await this.handleDetectOpportunities(args);
      case 'shim_get_opportunity_history': return await this.handleGetOpportunityHistory();
      case 'shim_validate_safety': return await this.handleValidateSafety(args);
      case 'shim_get_safety_config': return await this.handleGetSafetyConfig();
      case 'shim_collect_metrics': return await this.handleCollectMetrics();
      case 'shim_export_metrics': return await this.handleExportMetrics(args);
      case 'shim_get_metrics_summary': return await this.handleGetMetricsSummary();
      case 'shim_create_experiment': return await this.handleCreateExperiment(args);
      case 'shim_get_experiment_results': return await this.handleGetExperimentResults(args);
      case 'shim_get_feature_flags': return await this.handleGetFeatureFlags();

      // Evolution tools (20)
      case 'shim_deep_analyze': return await this.handleDeepAnalyze(args);
      case 'shim_analyze_patterns': return await this.handleAnalyzePatterns(args);
      case 'shim_ast_parse': return await this.handleAstParse(args);
      case 'shim_generate_improvement': return await this.handleGenerateImprovement(args);
      case 'shim_preview_change': return await this.handlePreviewChange(args);
      case 'shim_deploy_improvement': return await this.handleDeployImprovement(args);
      case 'shim_rollback_deployment': return await this.handleRollbackDeployment(args);
      case 'shim_get_deployment_history': return await this.handleGetDeploymentHistory();
      case 'shim_start_evolution': return await this.handleStartEvolution(args);
      case 'shim_get_evolution_status': return await this.handleGetEvolutionStatus();
      case 'shim_generate_experiment': return await this.handleGenerateExperiment(args);
      case 'shim_list_experiments': return await this.handleListExperiments();
      case 'shim_identify_improvements': return await this.handleIdentifyImprovements(args);
      case 'shim_prioritize_improvements': return await this.handlePrioritizeImprovements(args);
      case 'shim_profile_performance': return await this.handleProfilePerformance(args);
      case 'shim_get_performance_report': return await this.handleGetPerformanceReport(args);
      case 'shim_optimize_code': return await this.handleOptimizeCode(args);
      case 'shim_suggest_optimizations': return await this.handleSuggestOptimizations(args);
      case 'shim_self_deploy': return await this.handleSelfDeploy(args);
      case 'shim_get_self_deploy_history': return await this.handleGetSelfDeployHistory();

      // Autonomy tools (15)
      case 'shim_autonomous_execute': return await this.handleAutonomousExecute(args);
      case 'shim_get_autonomous_status': return await this.handleGetAutonomousStatus();
      case 'shim_make_decision': return await this.handleMakeDecision(args);
      case 'shim_explain_decision': return await this.handleExplainDecision(args);
      case 'shim_recover_from_failure': return await this.handleRecoverFromFailure(args);
      case 'shim_get_recovery_history': return await this.handleGetRecoveryHistory();
      case 'shim_process_feedback': return await this.handleProcessFeedback(args);
      case 'shim_get_feedback_insights': return await this.handleGetFeedbackInsights();
      case 'shim_decompose_goal': return await this.handleDecomposeGoal(args);
      case 'shim_get_decomposition': return await this.handleGetDecomposition(args);
      case 'shim_report_progress': return await this.handleReportProgress(args);
      case 'shim_track_progress': return await this.handleTrackProgress(args);
      case 'shim_get_progress': return await this.handleGetProgress(args);
      case 'shim_review_work': return await this.handleReviewWork(args);
      case 'shim_get_review_criteria': return await this.handleGetReviewCriteria();

      // Coordination tools (9)
      case 'shim_register_worker': return await this.handleRegisterWorker(args);
      case 'shim_get_worker_list': return await this.handleGetWorkerList();
      case 'shim_resolve_conflicts': return await this.handleResolveConflicts(args);
      case 'shim_get_conflict_history': return await this.handleGetConflictHistory();
      case 'shim_aggregate_results': return await this.handleAggregateResults(args);
      case 'shim_get_aggregation_status': return await this.handleGetAggregationStatus(args);
      case 'shim_distribute_task': return await this.handleDistributeTask(args);
      case 'shim_get_distribution_status': return await this.handleGetDistributionStatus(args);
      case 'shim_cancel_distribution': return await this.handleCancelDistribution(args);

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }
  }

  // ===== CORE HANDLERS (6) =====

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
          elapsed_time_ms: result.elapsedTime,
          silent: true
        }, null, 2)
      }]
    };
  }

  private async handleCheckRecovery() {
    const recovery = await this.recovery.checkRecovery();

    if (recovery.available) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            recovery_available: true,
            session_summary: recovery.summary,
            timestamp: recovery.timestamp,
            checkpoint_id: recovery.checkpointId
          }, null, 2)
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ recovery_available: false }, null, 2)
      }]
    };
  }

  private async handleMonitorSignals() {
    const signals = await this.signals.monitor();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          risk_level: signals.riskLevel,
          signals_detected: signals.signals,
          warnings: signals.warnings,
          should_checkpoint: signals.riskLevel > 0.7
        }, null, 2)
      }]
    };
  }

  private async handleAnalyzeCode(args: any) {
    const analysis = await this.codeAnalysis.analyze(args.directory);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          directory: args.directory,
          opportunities: analysis.opportunities,
          metrics: analysis.metrics,
          recommendations: analysis.recommendations
        }, null, 2)
      }]
    };
  }

  private async handleSessionStatus() {
    const status = await this.session.getStatus();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          active: true,
          last_checkpoint: status.lastCheckpoint,
          session_duration_minutes: status.sessionDuration,
          checkpoints_saved: status.checkpointsCount,
          recovery_available: status.recoveryAvailable,
          signals: status.signals
        }, null, 2)
      }]
    };
  }

  private async handleForceCheckpoint(args: any) {
    const result = await this.checkpoint.forceCheckpoint(args?.reason);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          checkpoint_id: result.checkpointId,
          state_saved: true,
          reason: args?.reason || 'Manual checkpoint requested'
        }, null, 2)
      }]
    };
  }

  // ===== ANALYTICS HANDLERS (14) =====

  private async handleStartAutoExperiments(args: any) {
    const result = await this.analytics.startAutoExperiments(args?.config);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleStopAutoExperiments() {
    const result = await this.analytics.stopAutoExperiments();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetExperimentStatus() {
    const result = await this.analytics.getExperimentStatus();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetImprovementReport() {
    const result = await this.analytics.getImprovementReport();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleDetectOpportunities(args: any) {
    const result = await this.analytics.detectOpportunities(args.metrics_data);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetOpportunityHistory() {
    const result = await this.analytics.getOpportunityHistory();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleValidateSafety(args: any) {
    const result = await this.analytics.validateSafety(args.change, args.bounds);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetSafetyConfig() {
    const result = await this.analytics.getSafetyConfig();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleCollectMetrics() {
    const result = await this.analytics.collectMetrics();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleExportMetrics(args: any) {
    const result = await this.analytics.exportMetrics(args.format);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetMetricsSummary() {
    const result = await this.analytics.getMetricsSummary();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleCreateExperiment(args: any) {
    const result = await this.analytics.createExperiment(args.config);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetExperimentResults(args: any) {
    const result = await this.analytics.getExperimentResults(args.experiment_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetFeatureFlags() {
    const result = await this.analytics.getFeatureFlags();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  // ===== EVOLUTION HANDLERS (20) =====

  private async handleDeepAnalyze(args: any) {
    const result = await this.evolution.deepAnalyze(args.directory, args.depth);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleAnalyzePatterns(args: any) {
    const result = await this.evolution.analyzePatterns(args.directory);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleAstParse(args: any) {
    const result = await this.evolution.astParse(args.file_path);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGenerateImprovement(args: any) {
    const result = await this.evolution.generateImprovement(args.opportunity);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handlePreviewChange(args: any) {
    const result = await this.evolution.previewChange(args.improvement_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleDeployImprovement(args: any) {
    const result = await this.evolution.deployImprovement(args.improvement_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleRollbackDeployment(args: any) {
    const result = await this.evolution.rollbackDeployment(args.deployment_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetDeploymentHistory() {
    const result = await this.evolution.getDeploymentHistory();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleStartEvolution(args: any) {
    const result = await this.evolution.startEvolution(args?.config);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetEvolutionStatus() {
    const result = await this.evolution.getEvolutionStatus();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGenerateExperiment(args: any) {
    const result = await this.evolution.generateExperiment(args.opportunity);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleListExperiments() {
    const result = await this.evolution.listExperiments();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleIdentifyImprovements(args: any) {
    const result = await this.evolution.identifyImprovements(args.directory);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handlePrioritizeImprovements(args: any) {
    const result = await this.evolution.prioritizeImprovements(args.improvements);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleProfilePerformance(args: any) {
    const result = await this.evolution.profilePerformance(args.directory);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetPerformanceReport(args: any) {
    const result = await this.evolution.getPerformanceReport(args.profile_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleOptimizeCode(args: any) {
    const result = await this.evolution.optimizeCode(args.file_path, args.optimization);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleSuggestOptimizations(args: any) {
    const result = await this.evolution.suggestOptimizations(args.file_path);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleSelfDeploy(args: any) {
    const result = await this.evolution.selfDeploy(args.change);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetSelfDeployHistory() {
    const result = await this.evolution.getSelfDeployHistory();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  // ===== AUTONOMY HANDLERS (15) =====

  private async handleAutonomousExecute(args: any) {
    const result = await this.autonomy.autonomousExecute(args.goal, args.context);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetAutonomousStatus() {
    const result = await this.autonomy.getAutonomousStatus();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleMakeDecision(args: any) {
    const result = await this.autonomy.makeDecision(args.context, args.options);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleExplainDecision(args: any) {
    const result = await this.autonomy.explainDecision(args.decision_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleRecoverFromFailure(args: any) {
    const result = await this.autonomy.recoverFromFailure(args.failure);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetRecoveryHistory() {
    const result = await this.autonomy.getRecoveryHistory();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleProcessFeedback(args: any) {
    const result = await this.autonomy.processFeedback(args.feedback);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetFeedbackInsights() {
    const result = await this.autonomy.getFeedbackInsights();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleDecomposeGoal(args: any) {
    const result = await this.autonomy.decomposeGoal(args.goal);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetDecomposition(args: any) {
    const result = await this.autonomy.getDecomposition(args.goal_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleReportProgress(args: any) {
    const result = await this.autonomy.reportProgress(args.task_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleTrackProgress(args: any) {
    const result = await this.autonomy.trackProgress(args.task_id, args.update);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetProgress(args: any) {
    const result = await this.autonomy.getProgress(args.task_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleReviewWork(args: any) {
    const result = await this.autonomy.reviewWork(args.work_product);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetReviewCriteria() {
    const result = await this.autonomy.getReviewCriteria();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  // ===== COORDINATION HANDLERS (9) =====

  private async handleRegisterWorker(args: any) {
    const result = await this.coordination.registerWorker(args.config);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetWorkerList() {
    const result = await this.coordination.getWorkerList();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleResolveConflicts(args: any) {
    const result = await this.coordination.resolveConflicts(args.conflicts);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetConflictHistory() {
    const result = await this.coordination.getConflictHistory();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleAggregateResults(args: any) {
    const result = await this.coordination.aggregateResults(args.task_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetAggregationStatus(args: any) {
    const result = await this.coordination.getAggregationStatus(args.task_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleDistributeTask(args: any) {
    const result = await this.coordination.distributeTask(args.task, args.num_workers);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleGetDistributionStatus(args: any) {
    const result = await this.coordination.getDistributionStatus(args.task_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  private async handleCancelDistribution(args: any) {
    const result = await this.coordination.cancelDistribution(args.task_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log to stderr (stdout is for MCP protocol)
    console.error('🚀 SHIM MCP Server v2.0 running');
    console.error('📍 Data directory: D:\\SHIM\\data');
    console.error('✅ Complete API surface: 58 tools');
    console.error('🎯 Crash prevention + Full intelligence suite');
  }
}

// Start the server
const server = new ShimMcpServer();
server.start().catch((error) => {
  console.error('❌ Failed to start SHIM MCP server:', error);
  process.exit(1);
});
