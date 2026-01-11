/**
 * GoalReporter
 *
 * Generate human-readable progress reports for autonomous goal execution.
 * Supports multiple output formats: text, markdown, JSON.
 *
 * Part of Phase 5: Autonomous Operation
 * Component 3/8
 */

import { ProgressTracker, GoalProgress } from './ProgressTracker';

export type ReportFormat = 'text' | 'markdown' | 'json';

export class GoalReporter {
  constructor() {
    // No initialization needed
  }

  /**
   * Generate progress report in specified format
   */
  generateReport(goalId: string, tracker: ProgressTracker, format: ReportFormat): string {
    // Validate format
    const validFormats: ReportFormat[] = ['text', 'markdown', 'json'];
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format: ${format}. Must be one of: ${validFormats.join(', ')}`);
    }

    const progress = tracker.getProgress(goalId);

    switch (format) {
      case 'text':
        return this.generateTextReport(goalId, progress);
      case 'markdown':
        return this.generateMarkdownReport(goalId, progress);
      case 'json':
        return this.generateJSONReport(goalId, progress);
    }
  }

  /**
   * Generate executive summary (concise, <500 chars)
   */
  generateExecutiveSummary(goalId: string, tracker: ProgressTracker): string {
    const progress = tracker.getProgress(goalId);

    let status = 'On track';
    if (progress.blockers.length > 0) {
      const highSeverityBlockers = progress.blockers.filter((b) => b.severity === 'high');
      if (highSeverityBlockers.length > 0) {
        status = `BLOCKED (${highSeverityBlockers.length} high severity)`;
      } else {
        status = `At risk (${progress.blockers.length} blockers)`;
      }
    }

    const summary = `Goal ${goalId}: ${progress.completionPercentage}% complete (${progress.completedSubGoals}/${progress.totalSubGoals} sub-goals). Status: ${status}. Velocity: ${progress.velocity.toFixed(2)} goals/hr.`;

    return summary;
  }

  /**
   * Generate detailed status report
   */
  generateDetailedReport(goalId: string, tracker: ProgressTracker): string {
    const progress = tracker.getProgress(goalId);

    let report = `=== Detailed Status Report ===\n`;
    report += `Goal ID: ${goalId}\n`;
    report += `Progress: ${progress.completionPercentage}% (${progress.completedSubGoals}/${progress.totalSubGoals})\n`;
    report += `Velocity: ${progress.velocity.toFixed(2)} sub-goals/hour\n`;
    report += `Estimated Hours Remaining: ${progress.estimatedHoursRemaining === Infinity ? 'Unknown' : progress.estimatedHoursRemaining.toFixed(2)}\n\n`;

    // Sub-Goals section
    report += `--- Sub-Goals ---\n`;
    report += `Total: ${progress.totalSubGoals}\n`;
    report += `Completed: ${progress.completedSubGoals}\n`;
    report += `In Progress: (tracked via status updates)\n`;
    report += `Pending: ${progress.totalSubGoals - progress.completedSubGoals}\n\n`;

    // Blockers section
    if (progress.blockers.length > 0) {
      report += `--- BLOCKERS ---\n`;
      progress.blockers.forEach((blocker) => {
        report += `- [${blocker.severity.toUpperCase()}] ${blocker.description}\n`;
      });
      report += `\n`;
    }

    // Milestones section
    report += `--- Milestones ---\n`;
    progress.milestones.forEach((milestone) => {
      const status = milestone.achieved 
        ? `✓ Achieved (${this.formatTimestamp(milestone.achievedAt!)})`
        : '○ Pending';
      report += `${milestone.targetPercentage}% - ${status}\n`;
    });

    return report;
  }

  /**
   * Generate multi-goal summary report
   */
  generateMultiGoalReport(goalIds: string[], tracker: ProgressTracker): string {
    if (goalIds.length === 0) {
      throw new Error('Goal list cannot be empty');
    }

    let report = `=== Multi-Goal Progress Report ===\n`;
    report += `Total Goals: ${goalIds.length}\n\n`;

    let totalSubGoals = 0;
    let totalCompleted = 0;

    goalIds.forEach((goalId) => {
      const progress = tracker.getProgress(goalId);
      totalSubGoals += progress.totalSubGoals;
      totalCompleted += progress.completedSubGoals;

      report += `--- ${goalId} ---\n`;
      report += `Progress: ${progress.completionPercentage}% (${progress.completedSubGoals}/${progress.totalSubGoals})\n`;
      report += `Velocity: ${progress.velocity.toFixed(2)} goals/hr\n`;
      if (progress.blockers.length > 0) {
        report += `⚠ Blockers: ${progress.blockers.length}\n`;
      }
      report += `\n`;
    });

    const overallPercentage = totalSubGoals > 0 
      ? Math.round((totalCompleted / totalSubGoals) * 100)
      : 0;

    report += `--- Overall Progress ---\n`;
    report += `${overallPercentage}% complete (${totalCompleted}/${totalSubGoals} total sub-goals)\n`;

    return report;
  }

  /**
   * Generate text format report
   */
  private generateTextReport(goalId: string, progress: GoalProgress): string {
    let report = `Goal Report: ${goalId}\n`;
    report += `${'='.repeat(40)}\n\n`;

    report += `Goal: ${goalId}\n`;
    report += `Progress: ${progress.completionPercentage}% (${progress.completedSubGoals}/${progress.totalSubGoals} completed)\n`;
    report += `Velocity: ${progress.velocity.toFixed(2)} sub-goals/hour\n`;
    report += `Estimated Hours Remaining: ${progress.estimatedHoursRemaining === Infinity ? 'Unknown' : progress.estimatedHoursRemaining.toFixed(2)}\n\n`;

    if (progress.blockers.length > 0) {
      report += `BLOCKERS:\n`;
      progress.blockers.forEach((blocker) => {
        report += `  - [${blocker.severity}] ${blocker.description}\n`;
      });
      report += `\n`;
    }

    report += `Milestones:\n`;
    progress.milestones.forEach((milestone) => {
      const status = milestone.achieved ? '✓' : '○';
      report += `  ${status} ${milestone.targetPercentage}% - ${milestone.name}\n`;
    });

    return report;
  }

  /**
   * Generate markdown format report
   */
  private generateMarkdownReport(goalId: string, progress: GoalProgress): string {
    let report = `# Goal Report: ${goalId}\n\n`;

    report += `**Goal ID:** ${goalId}\n\n`;
    report += `**Progress:** ${progress.completionPercentage}% (${progress.completedSubGoals}/${progress.totalSubGoals} completed)\n\n`;
    report += `**Velocity:** ${progress.velocity.toFixed(2)} sub-goals/hour\n\n`;
    report += `**Estimated Hours Remaining:** ${progress.estimatedHoursRemaining === Infinity ? 'Unknown' : progress.estimatedHoursRemaining.toFixed(2)}\n\n`;

    if (progress.blockers.length > 0) {
      report += `## ⚠️ BLOCKERS\n\n`;
      progress.blockers.forEach((blocker) => {
        report += `- **[${blocker.severity.toUpperCase()}]** ${blocker.description}\n`;
      });
      report += `\n`;
    }

    report += `## Milestones\n\n`;
    progress.milestones.forEach((milestone) => {
      const status = milestone.achieved ? '✅' : '⬜';
      report += `- ${status} ${milestone.targetPercentage}% - ${milestone.name}\n`;
    });

    return report;
  }

  /**
   * Generate JSON format report
   */
  private generateJSONReport(goalId: string, progress: GoalProgress): string {
    const report = {
      goalId,
      progress: {
        totalSubGoals: progress.totalSubGoals,
        completedSubGoals: progress.completedSubGoals,
        completionPercentage: progress.completionPercentage,
      },
      velocity: progress.velocity,
      estimatedHoursRemaining: progress.estimatedHoursRemaining,
      blockers: progress.blockers.map((blocker) => ({
        id: blocker.id,
        subGoalId: blocker.subGoalId,
        description: blocker.description,
        severity: blocker.severity,
        detectedAt: blocker.detectedAt.toISOString(),
      })),
      milestones: progress.milestones.map((milestone) => ({
        name: milestone.name,
        targetPercentage: milestone.targetPercentage,
        achieved: milestone.achieved,
        achievedAt: milestone.achievedAt?.toISOString(),
      })),
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Format timestamp for display
   */
  private formatTimestamp(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}
