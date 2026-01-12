/**
 * GoalReporter
 *
 * Generate human-readable progress reports for autonomous goal execution.
 * Supports multiple output formats: text, markdown, JSON.
 *
 * Part of Phase 5: Autonomous Operation
 * Component 3/8
 */
import { ProgressTracker } from './ProgressTracker';
export type ReportFormat = 'text' | 'markdown' | 'json';
export declare class GoalReporter {
    constructor();
    /**
     * Generate progress report in specified format
     */
    generateReport(goalId: string, tracker: ProgressTracker, format: ReportFormat): string;
    /**
     * Generate executive summary (concise, <500 chars)
     */
    generateExecutiveSummary(goalId: string, tracker: ProgressTracker): string;
    /**
     * Generate detailed status report
     */
    generateDetailedReport(goalId: string, tracker: ProgressTracker): string;
    /**
     * Generate multi-goal summary report
     */
    generateMultiGoalReport(goalIds: string[], tracker: ProgressTracker): string;
    /**
     * Generate text format report
     */
    private generateTextReport;
    /**
     * Generate markdown format report
     */
    private generateMarkdownReport;
    /**
     * Generate JSON format report
     */
    private generateJSONReport;
    /**
     * Format timestamp for display
     */
    private formatTimestamp;
}
//# sourceMappingURL=GoalReporter.d.ts.map