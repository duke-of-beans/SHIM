/**
 * ProgressTracker
 *
 * Real-time progress monitoring for autonomous goal execution.
 * Tracks sub-goal completion, detects blockers, estimates time to completion.
 *
 * Part of Phase 5: Autonomous Operation
 * Component 2/8
 */
import { GoalDecomposition } from './GoalDecomposer';
export interface Blocker {
    id: string;
    subGoalId: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    detectedAt: Date;
}
export interface Milestone {
    name: string;
    targetPercentage: number;
    achieved: boolean;
    achievedAt?: Date;
}
export interface GoalProgress {
    goalId: string;
    totalSubGoals: number;
    completedSubGoals: number;
    completionPercentage: number;
    estimatedHoursRemaining: number;
    blockers: Blocker[];
    milestones: Milestone[];
    velocity: number;
}
export declare class ProgressTracker {
    private tracking;
    constructor();
    /**
     * Start tracking a goal
     */
    startTracking(goalId: string, decomposition: GoalDecomposition, customMilestones?: Array<{
        name: string;
        targetPercentage: number;
    }>): void;
    /**
     * Update sub-goal status
     */
    updateSubGoal(goalId: string, subGoalId: string, status: 'complete' | 'blocked' | 'in_progress' | 'pending', severity?: 'low' | 'medium' | 'high'): void;
    /**
     * Get current progress
     */
    getProgress(goalId: string): GoalProgress;
    /**
     * Check if goal is blocked
     */
    isBlocked(goalId: string): boolean;
    /**
     * Estimate completion time
     */
    estimateCompletion(goalId: string): Date;
    /**
     * Check milestones
     */
    checkMilestones(goalId: string): Milestone[];
    /**
     * Calculate velocity (sub-goals per hour)
     */
    private calculateVelocity;
    /**
     * Calculate estimated hours remaining
     */
    private calculateEstimatedHours;
    /**
     * Update milestone achievements
     */
    private updateMilestones;
}
//# sourceMappingURL=ProgressTracker.d.ts.map