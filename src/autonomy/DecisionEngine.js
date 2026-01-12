"use strict";
/**
 * DecisionEngine
 *
 * Make intelligent decisions under uncertainty during autonomous execution.
 * Handles confidence scoring, risk assessment, and human escalation.
 *
 * Part of Phase 5: Autonomous Operation
 * Component 5/8
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionEngine = void 0;
class DecisionEngine {
    config;
    history;
    constructor(config = {}) {
        // Validate threshold
        if (config.confidenceThreshold !== undefined) {
            if (config.confidenceThreshold < 0 || config.confidenceThreshold > 1) {
                throw new Error('Confidence threshold must be between 0 and 1');
            }
        }
        this.config = {
            confidenceThreshold: config.confidenceThreshold ?? 0.6,
        };
        this.history = [];
    }
    /**
     * Make a decision given context
     */
    makeDecision(context) {
        if (context.options.length === 0) {
            throw new Error('Cannot make decision without options');
        }
        // Calculate confidence based on evidence
        const confidence = this.calculateConfidence(context);
        // Assess risk
        const riskLevel = this.assessRisk(context);
        // Determine if human escalation needed
        const requiresHuman = confidence < this.config.confidenceThreshold * 100 || riskLevel === 'high';
        // Select best option
        const choice = this.selectBestOption(context);
        // Generate rationale
        const rationale = this.generateRationale(context, choice, confidence);
        const decision = {
            choice,
            confidence,
            rationale,
            requiresHuman,
            riskLevel,
        };
        if (requiresHuman) {
            decision.escalationReason = this.generateEscalationReason(confidence, riskLevel);
        }
        // Log to history
        this.history.push({
            decision,
            context,
            timestamp: new Date(),
        });
        return decision;
    }
    /**
     * Evaluate multiple alternatives
     */
    evaluateAlternatives(alternatives) {
        const evaluations = alternatives.map((alt) => {
            const context = {
                question: `Evaluate ${alt.option}`,
                options: [alt.option],
                evidence: alt.evidence,
            };
            const confidence = this.calculateConfidence(context);
            const riskLevel = this.assessRisk(context);
            return {
                option: alt.option,
                confidence,
                riskLevel,
            };
        });
        // Sort by confidence (descending)
        return evaluations.sort((a, b) => b.confidence - a.confidence);
    }
    /**
     * Recommend best alternative
     */
    recommendBestAlternative(alternatives) {
        const evaluations = this.evaluateAlternatives(alternatives);
        return evaluations[0];
    }
    /**
     * Get decision history
     */
    getDecisionHistory(filter) {
        if (!filter) {
            return [...this.history];
        }
        return this.history.filter((record) => {
            if (filter.minConfidence !== undefined && record.decision.confidence < filter.minConfidence) {
                return false;
            }
            if (filter.maxConfidence !== undefined && record.decision.confidence > filter.maxConfidence) {
                return false;
            }
            if (filter.riskLevel !== undefined && record.decision.riskLevel !== filter.riskLevel) {
                return false;
            }
            if (filter.requiresHuman !== undefined && record.decision.requiresHuman !== filter.requiresHuman) {
                return false;
            }
            return true;
        });
    }
    /**
     * Detect if context has high uncertainty
     */
    detectUncertainty(context) {
        const uncertaintyScore = this.quantifyUncertainty(context);
        return uncertaintyScore > 50;
    }
    /**
     * Quantify uncertainty level (0-100)
     */
    quantifyUncertainty(context) {
        const confidence = this.calculateConfidence(context);
        return 100 - confidence;
    }
    /**
     * Calculate confidence score (0-100) based on evidence
     */
    calculateConfidence(context) {
        if (context.evidence.length === 0) {
            return 10; // Very low confidence with no evidence
        }
        // Simple heuristic: more evidence = higher confidence
        // Evidence quality matters too (keywords)
        let score = 0;
        const evidenceCount = context.evidence.length;
        score += Math.min(evidenceCount * 20, 60); // Up to 60 points for quantity (was 15)
        // Boost for quality indicators
        const highQualityKeywords = ['proven', 'tested', 'documented', 'reliable', 'standard', 'succeeded', 'pass', 'clear', 'reasonable'];
        const lowQualityKeywords = ['might', 'unclear', 'experimental', 'untested', 'failing', 'risk'];
        const allEvidence = context.evidence.join(' ').toLowerCase();
        highQualityKeywords.forEach((keyword) => {
            if (allEvidence.includes(keyword)) {
                score += 10; // Increased from 8
            }
        });
        lowQualityKeywords.forEach((keyword) => {
            if (allEvidence.includes(keyword)) {
                score -= 15;
            }
        });
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Assess risk level based on context
     */
    assessRisk(context) {
        const question = context.question.toLowerCase();
        const allEvidence = context.evidence.join(' ').toLowerCase();
        // High risk indicators
        const highRiskKeywords = ['production', 'delete', 'deploy', 'failing', 'unclear impact'];
        const lowRiskKeywords = ['comment', 'documentation', 'safe', 'reversible', 'low impact'];
        for (const keyword of highRiskKeywords) {
            if (question.includes(keyword) || allEvidence.includes(keyword)) {
                return 'high';
            }
        }
        for (const keyword of lowRiskKeywords) {
            if (question.includes(keyword) || allEvidence.includes(keyword)) {
                return 'low';
            }
        }
        return 'medium';
    }
    /**
     * Select best option from context
     */
    selectBestOption(context) {
        // Simple strategy: pick first option (in real implementation, would be more sophisticated)
        // Could use ML model, weighted scoring, etc.
        return context.options[0];
    }
    /**
     * Generate rationale for decision
     */
    generateRationale(context, choice, confidence) {
        const evidenceCount = context.evidence.length;
        if (confidence > 70) {
            return `High confidence (${confidence.toFixed(0)}%) based on ${evidenceCount} pieces of evidence. Chose "${choice}" as best option.`;
        }
        else if (confidence > 40) {
            return `Moderate confidence (${confidence.toFixed(0)}%) with ${evidenceCount} pieces of evidence. Chose "${choice}" but consider alternatives.`;
        }
        else {
            return `Low confidence (${confidence.toFixed(0)}%) with limited evidence (${evidenceCount}). Chose "${choice}" but human review recommended.`;
        }
    }
    /**
     * Generate escalation reason
     */
    generateEscalationReason(confidence, riskLevel) {
        if (riskLevel === 'high') {
            return `High risk decision requires human approval (confidence: ${confidence.toFixed(0)}%)`;
        }
        return `Low confidence (${confidence.toFixed(0)}%) requires human review`;
    }
}
exports.DecisionEngine = DecisionEngine;
//# sourceMappingURL=DecisionEngine.js.map