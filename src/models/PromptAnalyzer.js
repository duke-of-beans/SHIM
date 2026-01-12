"use strict";
/**
 * PromptAnalyzer - Intelligent Prompt Analysis
 *
 * Analyzes prompts to determine complexity and optimal model selection.
 *
 * Features:
 * - Complexity detection (simple/medium/complex)
 * - Capability detection (reasoning, creativity, code)
 * - Keyword extraction
 * - Task classification
 * - Model recommendation
 * - Confidence scoring
 *
 * Used by ModelRouter to automatically select the optimal Claude model
 * for each task, reducing costs while maintaining quality.
 *
 * Example:
 * ```typescript
 * const analyzer = new PromptAnalyzer();
 * const analysis = analyzer.analyze('Implement a binary search tree');
 *
 * // {
 * //   complexity: 'complex',
 * //   requiresReasoning: true,
 * //   hasCodeGeneration: true,
 * //   recommendedModel: 'opus',
 * //   confidence: 0.92
 * // }
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptAnalyzer = void 0;
class PromptAnalyzer {
    SIMPLE_MAX_LENGTH = 100;
    COMPLEX_MIN_LENGTH = 300;
    REASONING_KEYWORDS = [
        'why', 'explain', 'reasoning', 'because', 'analyze', 'compare',
        'tradeoff', 'advantage', 'disadvantage', 'impact', 'consequence'
    ];
    CREATIVITY_KEYWORDS = [
        'create', 'design', 'generate', 'innovative', 'unique', 'creative',
        'original', 'brainstorm', 'imagine', 'invent'
    ];
    CODE_KEYWORDS = [
        'implement', 'code', 'function', 'algorithm', 'write', 'program',
        'script', 'class', 'method', 'api', 'component', 'module'
    ];
    COMPLEX_INDICATORS = [
        'distributed', 'architecture', 'system design', 'fault tolerance',
        'scalability', 'optimization', 'comprehensive', 'detailed',
        'multi-step', 'end-to-end'
    ];
    STOP_WORDS = new Set([
        'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
        'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
        'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
        'that', 'these', 'those', 'it', 'its', 'what', 'which', 'who', 'when',
        'where', 'how'
    ]);
    /**
     * Analyze a prompt
     */
    analyze(prompt) {
        const normalized = prompt.toLowerCase().trim();
        // Handle empty prompt
        if (!normalized) {
            return {
                complexity: 'simple',
                requiresReasoning: false,
                requiresCreativity: false,
                hasCodeGeneration: false,
                keywords: [],
                recommendedModel: 'haiku',
                confidence: 0.3,
                taskType: 'other',
                estimatedTokens: 0
            };
        }
        // Detect capabilities
        const requiresReasoning = this.detectRequirement(normalized, this.REASONING_KEYWORDS);
        const requiresCreativity = this.detectRequirement(normalized, this.CREATIVITY_KEYWORDS);
        const hasCodeGeneration = this.detectRequirement(normalized, this.CODE_KEYWORDS);
        // Determine complexity
        const complexity = this.determineComplexity(normalized, requiresReasoning, hasCodeGeneration);
        // Extract keywords
        const keywords = this.extractKeywords(normalized);
        // Classify task
        const taskType = this.classifyTask(normalized);
        // Recommend model
        const recommendedModel = this.recommendModel(complexity, hasCodeGeneration, taskType);
        // Calculate confidence
        const confidence = this.calculateConfidence(normalized, complexity, taskType);
        // Estimate tokens
        const estimatedTokens = this.estimateTokens(prompt);
        return {
            complexity,
            requiresReasoning,
            requiresCreativity,
            hasCodeGeneration,
            keywords,
            recommendedModel,
            confidence,
            taskType,
            estimatedTokens
        };
    }
    /**
     * Analyze multiple prompts
     */
    analyzeMultiple(prompts) {
        return prompts.map(p => this.analyze(p));
    }
    /**
     * Detect if prompt requires specific capability
     */
    detectRequirement(prompt, keywords) {
        return keywords.some(keyword => prompt.includes(keyword));
    }
    /**
     * Determine complexity level
     */
    determineComplexity(prompt, requiresReasoning, hasCodeGeneration) {
        const length = prompt.length;
        // Check for complex indicators
        const hasComplexIndicators = this.COMPLEX_INDICATORS.some(indicator => prompt.includes(indicator));
        // Simple heuristics
        if (length < this.SIMPLE_MAX_LENGTH && !hasComplexIndicators) {
            return 'simple';
        }
        if (length > this.COMPLEX_MIN_LENGTH || hasComplexIndicators) {
            return 'complex';
        }
        if (hasCodeGeneration || requiresReasoning) {
            return length > 150 ? 'complex' : 'medium';
        }
        return 'medium';
    }
    /**
     * Extract meaningful keywords
     */
    extractKeywords(prompt) {
        const words = prompt
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .split(/\s+/)
            .filter(word => word.length > 2) // Filter short words
            .filter(word => !this.STOP_WORDS.has(word)); // Filter stop words
        // Deduplicate
        return Array.from(new Set(words));
    }
    /**
     * Classify task type
     */
    classifyTask(prompt) {
        // Question patterns
        if (/^(what|how|why|when|where|who|which)\s/.test(prompt)) {
            return 'question';
        }
        // Code generation
        if (this.detectRequirement(prompt, this.CODE_KEYWORDS)) {
            return 'code_generation';
        }
        // Explanation
        if (prompt.includes('explain') || prompt.includes('describe') || prompt.includes('walk')) {
            return 'explanation';
        }
        // Design
        if (prompt.includes('design') || prompt.includes('architect') || prompt.includes('plan')) {
            return 'design';
        }
        // Analysis
        if (prompt.includes('analyze') || prompt.includes('compare') || prompt.includes('evaluate')) {
            return 'analysis';
        }
        // Creative
        if (this.detectRequirement(prompt, this.CREATIVITY_KEYWORDS)) {
            return 'creative';
        }
        return 'other';
    }
    /**
     * Recommend optimal model
     */
    recommendModel(complexity, hasCodeGeneration, taskType) {
        // Code generation always uses Opus for quality
        if (hasCodeGeneration) {
            return 'opus';
        }
        // Design and analysis use Opus
        if (taskType === 'design' || taskType === 'analysis') {
            return 'opus';
        }
        // Simple questions use Haiku
        if (complexity === 'simple' && taskType === 'question') {
            return 'haiku';
        }
        // Complex tasks use Opus
        if (complexity === 'complex') {
            return 'opus';
        }
        // Medium complexity uses Sonnet
        return 'sonnet';
    }
    /**
     * Calculate confidence score
     */
    calculateConfidence(prompt, complexity, taskType) {
        let confidence = 0.5; // Base confidence
        // Clear task type increases confidence
        if (taskType !== 'other') {
            confidence += 0.2;
        }
        // Clear complexity indicators
        if (prompt.length < 50 || prompt.length > 400) {
            confidence += 0.1;
        }
        // Question marks (clear questions)
        if (prompt.includes('?')) {
            confidence += 0.1;
        }
        // Complex indicators present
        if (this.COMPLEX_INDICATORS.some(i => prompt.includes(i))) {
            confidence += 0.1;
        }
        // Cap at 1.0
        return Math.min(confidence, 1.0);
    }
    /**
     * Estimate token count (rough approximation)
     */
    estimateTokens(prompt) {
        // Rough estimate: 1 token ≈ 4 characters
        return Math.ceil(prompt.length / 4);
    }
}
exports.PromptAnalyzer = PromptAnalyzer;
//# sourceMappingURL=PromptAnalyzer.js.map