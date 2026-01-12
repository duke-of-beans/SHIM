"use strict";
/**
 * PatternLearner
 *
 * ML-based pattern recognition from historical improvements.
 * Part of Priority 3: ML Pattern Recognition
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatternLearner = void 0;
class PatternLearner {
    history;
    patterns;
    constructor() {
        this.history = [];
        this.patterns = new Map();
    }
    recordImprovement(improvement) {
        this.history.push(improvement);
        this.updatePatterns();
    }
    learnPatterns() {
        this.updatePatterns();
        return Array.from(this.patterns.values());
    }
    predictSuccess(context) {
        const scores = [];
        this.patterns.forEach((pattern) => {
            const similarity = this.calculateSimilarity(context, pattern.contexts);
            const confidence = similarity * pattern.successRate;
            const expectedImpact = pattern.averageImpact * confidence;
            scores.push({
                pattern: pattern.description,
                confidence,
                expectedImpact,
                reasoning: this.generateReasoning(pattern, similarity),
            });
        });
        return scores.sort((a, b) => b.confidence - a.confidence);
    }
    getTopPatterns(limit = 5) {
        const patterns = Array.from(this.patterns.values());
        return patterns
            .sort((a, b) => b.successRate * b.frequency - a.successRate * a.frequency)
            .slice(0, limit);
    }
    getPatternStats() {
        const patterns = Array.from(this.patterns.values());
        const avgSuccess = patterns.length > 0
            ? patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length
            : 0;
        return {
            totalPatterns: patterns.length,
            totalImprovements: this.history.length,
            averageSuccessRate: avgSuccess,
        };
    }
    updatePatterns() {
        const patternGroups = new Map();
        this.history.forEach((improvement) => {
            const pattern = improvement.pattern;
            if (!patternGroups.has(pattern)) {
                patternGroups.set(pattern, []);
            }
            patternGroups.get(pattern).push(improvement);
        });
        patternGroups.forEach((improvements, patternKey) => {
            const successes = improvements.filter((i) => i.outcome.success).length;
            const totalImpact = improvements.reduce((sum, i) => sum + i.modification.impactScore, 0);
            const pattern = {
                id: patternKey,
                description: patternKey,
                frequency: improvements.length,
                successRate: successes / improvements.length,
                averageImpact: totalImpact / improvements.length,
                contexts: improvements.map((i) => i.context),
            };
            this.patterns.set(patternKey, pattern);
        });
    }
    calculateSimilarity(context, patterns) {
        if (patterns.length === 0)
            return 0;
        const similarities = patterns.map((p) => {
            const complexityDiff = Math.abs(context.complexity - p.complexity);
            const maintDiff = Math.abs(context.maintainability - p.maintainability);
            const locDiff = Math.abs(context.linesOfCode - p.linesOfCode);
            const complexitySim = 1 - Math.min(complexityDiff / 100, 1);
            const maintSim = 1 - Math.min(maintDiff / 100, 1);
            const locSim = 1 - Math.min(locDiff / 10000, 1);
            return (complexitySim + maintSim + locSim) / 3;
        });
        return similarities.reduce((sum, s) => sum + s, 0) / similarities.length;
    }
    generateReasoning(pattern, similarity) {
        return `Pattern "${pattern.description}" has ${pattern.frequency} occurrences ` +
            `with ${(pattern.successRate * 100).toFixed(1)}% success rate. ` +
            `Context similarity: ${(similarity * 100).toFixed(1)}%.`;
    }
}
exports.PatternLearner = PatternLearner;
//# sourceMappingURL=PatternLearner.js.map