/**
 * Code Analysis Handler
 * 
 * Analyzes code quality in a directory.
 * Returns top improvement opportunities ranked by ROI.
 * 
 * Uses existing AST analyzer and pattern detection from Phase 4.
 */

import { BaseHandler, HandlerResult } from './base-handler.js';
import { EvolutionCoordinator } from '../../evolution/EvolutionCoordinator.js';
import path from 'path';

interface CodeAnalysisArgs {
  directory: string;
  max_opportunities?: number;
}

export class CodeAnalysisHandler extends BaseHandler {
  private evolutionCoordinator: EvolutionCoordinator;

  constructor() {
    super();
    
    const dataDir = path.join(process.cwd(), 'data', 'evolution');
    
    // Initialize evolution coordinator (includes AST analysis)
    this.evolutionCoordinator = new EvolutionCoordinator(dataDir);
    
    this.log('Code Analysis Handler initialized');
  }

  async execute(args: CodeAnalysisArgs): Promise<HandlerResult> {
    try {
      const startTime = Date.now();

      // Validate directory
      if (!args.directory) {
        throw new Error('Directory parameter required');
      }

      const maxOpportunities = args.max_opportunities || 10;

      // Analyze codebase
      this.log('Starting code analysis', { directory: args.directory });
      
      const analysis = await this.evolutionCoordinator.analyzeCodebase(
        args.directory,
        maxOpportunities
      );

      const elapsed = Date.now() - startTime;

      this.log('Code analysis complete', {
        filesAnalyzed: analysis.filesAnalyzed,
        opportunitiesFound: analysis.opportunities.length,
        elapsed: `${elapsed}ms`,
      });

      // Return analysis results
      return {
        success: true,
        directory: args.directory,
        files_analyzed: analysis.filesAnalyzed,
        total_loc: analysis.totalLinesOfCode,
        avg_complexity: analysis.avgComplexity,
        opportunities: analysis.opportunities.slice(0, maxOpportunities).map(opp => ({
          type: opp.type,
          file: opp.file,
          description: opp.description,
          roi_score: opp.roiScore,
          estimated_effort_hours: opp.estimatedEffortHours,
          estimated_value: opp.estimatedValue,
          priority: opp.priority,
        })),
        elapsed_ms: elapsed,
      };
    } catch (error) {
      return this.handleError(error, 'code-analysis');
    }
  }
}
