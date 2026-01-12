"use strict";
/**
 * ProgressTracker
 *
 * Real-time progress monitoring for autonomous goal execution.
 * Tracks sub-goal completion, detects blockers, estimates time to completion.
 *
 * Part of Phase 5: Autonomous Operation
 * Component 2/8
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressTracker = void 0;
class ProgressTracker {
    tracking;
    constructor() {
        this.tracking = new Map();
    }
    /**
     * Start tracking a goal
     */
    startTracking(goalId, decomposition, customMilestones) {
        if (this.tracking.has(goalId)) {
            throw new Error(`Goal ${goalId} is already being tracked`);
        }
        // Initialize sub-goal statuses
        const subGoalStatuses = new Map();
        decomposition.subGoals.forEach((subGoal) => {
            subGoalStatuses.set(subGoal.id, {
                id: subGoal.id,
                status: 'pending',
            });
        });
        // Initialize milestones
        const milestones = customMilestones
            ? customMilestones.map((m) => ({
                name: m.name,
                targetPercentage: m.targetPercentage,
                achieved: false,
            }))
            : [
                { name: '25% Complete', targetPercentage: 25, achieved: false },
                { name: '50% Complete', targetPercentage: 50, achieved: false },
                { name: '75% Complete', targetPercentage: 75, achieved: false },
                { name: '100% Complete', targetPercentage: 100, achieved: false },
            ];
        this.tracking.set(goalId, {
            goalId,
            decomposition,
            subGoalStatuses,
            startedAt: new Date(),
            milestones,
            completions: [],
        });
    }
    /**
     * Update sub-goal status
     */
    updateSubGoal(goalId, subGoalId, status, severity) {
        const tracking = this.tracking.get(goalId);
        if (!tracking) {
            throw new Error(`Goal ${goalId} is not being tracked`);
        }
        const subGoalStatus = tracking.subGoalStatuses.get(subGoalId);
        if (!subGoalStatus) {
            throw new Error(`Sub-goal ${subGoalId} not found in goal ${goalId}`);
        }
        // Validate status
        const validStatuses = ['complete', 'blocked', 'in_progress', 'pending'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status: ${status}`);
        }
        // Validate severity if blocked
        if (status === 'blocked') {
            const validSeverities = ['low', 'medium', 'high'];
            if (severity && !validSeverities.includes(severity)) {
                throw new Error(`Invalid severity: ${severity}`);
            }
        }
        // Update status
        subGoalStatus.status = status;
        // Track completion
        if (status === 'complete' && !subGoalStatus.completedAt) {
            subGoalStatus.completedAt = new Date();
            tracking.completions.push({
                subGoalId,
                timestamp: new Date(),
            });
            // Remove blocker if existed
            delete subGoalStatus.blocker;
        }
        // Track blocker
        if (status === 'blocked') {
            const subGoal = tracking.decomposition.subGoals.find((sg) => sg.id === subGoalId);
            subGoalStatus.blocker = {
                id: `blocker-${subGoalId}-${Date.now()}`,
                subGoalId,
                description: subGoal?.description || 'Unknown',
                severity: severity || 'medium',
                detectedAt: new Date(),
            };
        }
        else {
            // Remove blocker if unblocked
            delete subGoalStatus.blocker;
        }
        // Update milestones
        this.updateMilestones(goalId);
    }
    /**
     * Get current progress
     */
    getProgress(goalId) {
        const tracking = this.tracking.get(goalId);
        if (!tracking) {
            throw new Error(`Goal ${goalId} is not being tracked`);
        }
        const totalSubGoals = tracking.decomposition.subGoals.length;
        const completedSubGoals = Array.from(tracking.subGoalStatuses.values()).filter((status) => status.status === 'complete').length;
        const completionPercentage = totalSubGoals > 0
            ? Math.round((completedSubGoals / totalSubGoals) * 100)
            : 0;
        const velocity = this.calculateVelocity(tracking);
        const estimatedHoursRemaining = this.calculateEstimatedHours(tracking, velocity);
        const blockers = Array.from(tracking.subGoalStatuses.values())
            .filter((status) => status.blocker)
            .map((status) => status.blocker);
        return {
            goalId,
            totalSubGoals,
            completedSubGoals,
            completionPercentage,
            estimatedHoursRemaining,
            blockers,
            milestones: tracking.milestones,
            velocity,
        };
    }
    /**
     * Check if goal is blocked
     */
    isBlocked(goalId) {
        const tracking = this.tracking.get(goalId);
        if (!tracking) {
            throw new Error(`Goal ${goalId} is not being tracked`);
        }
        return Array.from(tracking.subGoalStatuses.values()).some((status) => status.status === 'blocked');
    }
    /**
     * Estimate completion time
     */
    estimateCompletion(goalId) {
        const tracking = this.tracking.get(goalId);
        if (!tracking) {
            throw new Error(`Goal ${goalId} is not being tracked`);
        }
        const progress = this.getProgress(goalId);
        // If complete, return now
        if (progress.completionPercentage === 100) {
            return new Date();
        }
        // If no velocity, return far future
        if (progress.velocity === 0) {
            return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
        }
        // Calculate based on velocity
        const remainingSubGoals = progress.totalSubGoals - progress.completedSubGoals;
        const hoursRemaining = remainingSubGoals / progress.velocity;
        const msRemaining = hoursRemaining * 60 * 60 * 1000;
        return new Date(Date.now() + msRemaining);
    }
    /**
     * Check milestones
     */
    checkMilestones(goalId) {
        const tracking = this.tracking.get(goalId);
        if (!tracking) {
            throw new Error(`Goal ${goalId} is not being tracked`);
        }
        return tracking.milestones;
    }
    /**
     * Calculate velocity (sub-goals per hour)
     */
    calculateVelocity(tracking) {
        if (tracking.completions.length === 0) {
            return 0;
        }
        const now = Date.now();
        const startTime = tracking.startedAt.getTime();
        const elapsedMs = now - startTime;
        if (elapsedMs === 0) {
            return 0;
        }
        const elapsedHours = elapsedMs / (1000 * 60 * 60);
        const completedCount = tracking.completions.length;
        return completedCount / elapsedHours;
    }
    /**
     * Calculate estimated hours remaining
     */
    calculateEstimatedHours(tracking, velocity) {
        if (velocity === 0) {
            return Infinity;
        }
        const totalSubGoals = tracking.decomposition.subGoals.length;
        const completedSubGoals = tracking.completions.length;
        const remainingSubGoals = totalSubGoals - completedSubGoals;
        return remainingSubGoals / velocity;
    }
    /**
     * Update milestone achievements
     */
    updateMilestones(goalId) {
        const tracking = this.tracking.get(goalId);
        if (!tracking) {
            return;
        }
        const progress = this.getProgress(goalId);
        tracking.milestones.forEach((milestone) => {
            if (!milestone.achieved && progress.completionPercentage >= milestone.targetPercentage) {
                milestone.achieved = true;
                milestone.achievedAt = new Date();
            }
        });
    }
}
exports.ProgressTracker = ProgressTracker;
//# sourceMappingURL=ProgressTracker.js.map