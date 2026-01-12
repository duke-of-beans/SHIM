/**
 * PatternLearner
 *
 * ML-based pattern recognition from historical improvements.
 * Part of Priority 3: ML Pattern Recognition
 */
export interface HistoricalImprovement {
    id: string;
    pattern: string;
    context: {
        complexity: number;
        maintainability: number;
        linesOfCode: number;
    };
    modification: {
        type: string;
        impactScore: number;
    };
    outcome: {
        success: boolean;
        complexityDelta: number;
        maintainabilityDelta: number;
    };
    timestamp: Date;
}
export interface Pattern {
    id: string;
    description: string;
    frequency: number;
    successRate: number;
    averageImpact: number;
    contexts: Array<{
        complexity: number;
        maintainability: number;
        linesOfCode: number;
    }>;
}
export interface PredictionScore {
    pattern: string;
    confidence: number;
    expectedImpact: number;
    reasoning: string;
}
export declare class PatternLearner {
    private history;
    private patterns;
    constructor();
    recordImprovement(improvement: HistoricalImprovement): void;
    learnPatterns(): Pattern[];
    predictSuccess(context: {
        complexity: number;
        maintainability: number;
        linesOfCode: number;
    }): PredictionScore[];
    getTopPatterns(limit?: number): Pattern[];
    getPatternStats(): {
        totalPatterns: number;
        totalImprovements: number;
        averageSuccessRate: number;
    };
    private updatePatterns;
    private calculateSimilarity;
    private generateReasoning;
}
//# sourceMappingURL=PatternLearner.d.ts.map