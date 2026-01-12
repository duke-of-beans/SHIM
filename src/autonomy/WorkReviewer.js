"use strict";
/**
 * WorkReviewer
 *
 * Assess quality of completed work and provide improvement recommendations.
 * Evaluates completeness, correctness, and maintainability.
 *
 * Part of Phase 5: Autonomous Operation
 * Component 7/8
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkReviewer = void 0;
class WorkReviewer {
    config;
    history;
    constructor(config = {}) {
        // Default weights
        const weights = {
            completeness: config.criteriaWeights?.completeness ?? 0.3,
            correctness: config.criteriaWeights?.correctness ?? 0.4,
            maintainability: config.criteriaWeights?.maintainability ?? 0.3,
        };
        // Validate weights sum to 1.0
        const sum = weights.completeness + weights.correctness + weights.maintainability;
        if (Math.abs(sum - 1.0) > 0.001) {
            throw new Error('Criteria weights must sum to 1.0');
        }
        this.config = {
            criteriaWeights: weights,
            passThreshold: config.passThreshold ?? 70,
        };
        this.history = [];
    }
    /**
     * Assess work quality and generate review report
     */
    assess(workItem) {
        if (!workItem.id) {
            throw new Error('Work item must have an ID');
        }
        // Assess each criterion
        const completeness = this.assessCompleteness(workItem);
        const correctness = this.assessCorrectness(workItem);
        const maintainability = this.assessMaintainability(workItem);
        const criteriaScores = {
            completeness,
            correctness,
            maintainability,
        };
        // Calculate overall score (weighted average)
        const overallScore = completeness * this.config.criteriaWeights.completeness +
            correctness * this.config.criteriaWeights.correctness +
            maintainability * this.config.criteriaWeights.maintainability;
        // Detect issues
        const issues = this.detectIssues(workItem, criteriaScores);
        // Generate recommendations
        const recommendations = this.generateRecommendations(workItem, criteriaScores, issues);
        // Determine pass/fail
        const passed = overallScore >= this.config.passThreshold;
        const report = {
            workId: workItem.id,
            overallScore: Math.round(overallScore),
            criteriaScores: {
                completeness: Math.round(completeness),
                correctness: Math.round(correctness),
                maintainability: Math.round(maintainability),
            },
            issues,
            recommendations,
            passed,
            timestamp: new Date(),
        };
        // Record in history
        this.history.push({
            report,
            timestamp: new Date(),
        });
        return report;
    }
    /**
     * Get review history
     */
    getReviewHistory(filter) {
        let results = [...this.history];
        if (filter) {
            if (filter.workId) {
                results = results.filter((r) => r.report.workId === filter.workId);
            }
            if (filter.minScore !== undefined) {
                const minScore = filter.minScore;
                results = results.filter((r) => r.report.overallScore >= minScore);
            }
            if (filter.maxScore !== undefined) {
                const maxScore = filter.maxScore;
                results = results.filter((r) => r.report.overallScore <= maxScore);
            }
        }
        return results;
    }
    /**
     * Get quality trends over time
     */
    getQualityTrends() {
        const scores = this.history.map((r) => r.report.overallScore);
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        // Determine trend (compare first half to second half)
        let trend = 'stable';
        if (scores.length >= 3) {
            const midpoint = Math.floor(scores.length / 2);
            const firstHalf = scores.slice(0, midpoint);
            const secondHalf = scores.slice(midpoint);
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            if (secondAvg > firstAvg + 5) {
                trend = 'improving';
            }
            else if (secondAvg < firstAvg - 5) {
                trend = 'declining';
            }
        }
        return {
            averageScore: Math.round(averageScore),
            trend,
            recentScores: scores.slice(-5),
        };
    }
    /**
     * Assess completeness (are all expected artifacts present?)
     */
    assessCompleteness(workItem) {
        const { artifacts } = workItem;
        if (artifacts.length === 0) {
            return 20; // Very low score for no artifacts
        }
        let score = 50; // Base score for having some artifacts
        // Bonus points for having multiple artifacts
        score += Math.min(artifacts.length * 10, 30);
        // Bonus for having tests
        const hasTests = artifacts.some((a) => a.includes('.test.') || a.includes('.spec.'));
        if (hasTests) {
            score += 10;
        }
        // Bonus for having documentation
        const hasDocs = artifacts.some((a) => a.toLowerCase().includes('readme') || a.endsWith('.md'));
        if (hasDocs) {
            score += 10;
        }
        return Math.min(100, score);
    }
    /**
     * Assess correctness (does the work appear correct?)
     */
    assessCorrectness(workItem) {
        const { artifacts } = workItem;
        let score = 50; // Base score
        // Boost for having tests (implies verification)
        const hasTests = artifacts.some((a) => a.includes('.test.') || a.includes('.spec.'));
        if (hasTests) {
            score += 30;
        }
        // Boost for having implementation files
        const hasImpl = artifacts.some((a) => a.endsWith('.ts') || a.endsWith('.js'));
        if (hasImpl) {
            score += 10;
        }
        // Boost for paired impl + test files
        const implFiles = artifacts.filter((a) => !a.includes('.test.') && !a.includes('.spec.'));
        const testFiles = artifacts.filter((a) => a.includes('.test.') || a.includes('.spec.'));
        if (implFiles.length > 0 && testFiles.length > 0) {
            score += 10;
        }
        return Math.min(100, score);
    }
    /**
     * Assess maintainability (is the work maintainable?)
     */
    assessMaintainability(workItem) {
        const { artifacts } = workItem;
        let score = 60; // Base score
        // Boost for documentation
        const hasDocs = artifacts.some((a) => a.toLowerCase().includes('readme') || a.endsWith('.md'));
        if (hasDocs) {
            score += 20;
        }
        // Boost for TypeScript (type safety)
        const hasTypeScript = artifacts.some((a) => a.endsWith('.ts'));
        if (hasTypeScript) {
            score += 10;
        }
        // Boost for organized structure (multiple files)
        if (artifacts.length >= 3) {
            score += 10;
        }
        return Math.min(100, score);
    }
    /**
     * Detect quality issues
     */
    detectIssues(workItem, scores) {
        const issues = [];
        const { artifacts } = workItem;
        // Critical: No artifacts at all
        if (artifacts.length === 0) {
            issues.push({
                severity: 'critical',
                description: 'No artifacts produced',
                category: 'completeness',
            });
        }
        // Major: Missing tests
        const hasTests = artifacts.some((a) => a.includes('.test.') || a.includes('.spec.'));
        if (!hasTests && artifacts.length > 0) {
            issues.push({
                severity: 'major',
                description: 'Missing test files',
                category: 'correctness',
            });
        }
        // Major: Missing documentation
        const hasDocs = artifacts.some((a) => a.toLowerCase().includes('readme') || a.endsWith('.md'));
        if (!hasDocs && artifacts.length > 0) {
            issues.push({
                severity: 'major',
                description: 'Missing documentation',
                category: 'maintainability',
            });
        }
        // Minor: Low completeness score
        if (scores.completeness < 50) {
            issues.push({
                severity: 'minor',
                description: 'Incomplete work detected',
                category: 'completeness',
            });
        }
        return issues;
    }
    /**
     * Generate improvement recommendations
     */
    generateRecommendations(workItem, scores, issues) {
        const recommendations = [];
        const { artifacts } = workItem;
        // Recommend adding tests
        const hasTests = artifacts.some((a) => a.includes('.test.') || a.includes('.spec.'));
        if (!hasTests) {
            recommendations.push('Add test coverage to verify correctness');
        }
        // Recommend adding documentation
        const hasDocs = artifacts.some((a) => a.toLowerCase().includes('readme') || a.endsWith('.md'));
        if (!hasDocs) {
            recommendations.push('Add documentation (README.md) for maintainability');
        }
        // Recommend improving low scores
        if (scores.completeness < 70) {
            recommendations.push('Ensure all planned artifacts are completed');
        }
        if (scores.correctness < 70) {
            recommendations.push('Add verification mechanisms (tests, validation)');
        }
        if (scores.maintainability < 70) {
            recommendations.push('Improve code organization and documentation');
        }
        return recommendations;
    }
}
exports.WorkReviewer = WorkReviewer;
//# sourceMappingURL=WorkReviewer.js.map