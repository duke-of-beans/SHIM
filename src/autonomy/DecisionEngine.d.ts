/**
 * DecisionEngine
 *
 * Make intelligent decisions under uncertainty during autonomous execution.
 * Handles confidence scoring, risk assessment, and human escalation.
 *
 * Part of Phase 5: Autonomous Operation
 * Component 5/8
 */
export type RiskLevel = 'low' | 'medium' | 'high';
export interface DecisionContext {
    question: string;
    options: string[];
    evidence: string[];
}
export interface Decision {
    choice: string;
    confidence: number;
    rationale: string;
    requiresHuman: boolean;
    escalationReason?: string;
    riskLevel: RiskLevel;
}
export interface AlternativeOption {
    option: string;
    evidence: string[];
}
export interface AlternativeEvaluation {
    option: string;
    confidence: number;
    riskLevel: RiskLevel;
}
export interface DecisionRecord {
    decision: Decision;
    context: DecisionContext;
    timestamp: Date;
}
export interface DecisionHistoryFilter {
    minConfidence?: number;
    maxConfidence?: number;
    riskLevel?: RiskLevel;
    requiresHuman?: boolean;
}
export interface DecisionEngineConfig {
    confidenceThreshold?: number;
}
export declare class DecisionEngine {
    private config;
    private history;
    constructor(config?: DecisionEngineConfig);
    /**
     * Make a decision given context
     */
    makeDecision(context: DecisionContext): Decision;
    /**
     * Evaluate multiple alternatives
     */
    evaluateAlternatives(alternatives: AlternativeOption[]): AlternativeEvaluation[];
    /**
     * Recommend best alternative
     */
    recommendBestAlternative(alternatives: AlternativeOption[]): AlternativeEvaluation;
    /**
     * Get decision history
     */
    getDecisionHistory(filter?: DecisionHistoryFilter): DecisionRecord[];
    /**
     * Detect if context has high uncertainty
     */
    detectUncertainty(context: DecisionContext): boolean;
    /**
     * Quantify uncertainty level (0-100)
     */
    quantifyUncertainty(context: DecisionContext): number;
    /**
     * Calculate confidence score (0-100) based on evidence
     */
    private calculateConfidence;
    /**
     * Assess risk level based on context
     */
    private assessRisk;
    /**
     * Select best option from context
     */
    private selectBestOption;
    /**
     * Generate rationale for decision
     */
    private generateRationale;
    /**
     * Generate escalation reason
     */
    private generateEscalationReason;
}
//# sourceMappingURL=DecisionEngine.d.ts.map