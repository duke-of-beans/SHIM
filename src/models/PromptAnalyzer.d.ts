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
export type ComplexityLevel = 'simple' | 'medium' | 'complex';
export type ModelType = 'haiku' | 'sonnet' | 'opus';
export type TaskType = 'question' | 'explanation' | 'code_generation' | 'design' | 'analysis' | 'creative' | 'other';
export interface PromptAnalysis {
    complexity: ComplexityLevel;
    requiresReasoning: boolean;
    requiresCreativity: boolean;
    hasCodeGeneration: boolean;
    keywords: string[];
    recommendedModel: ModelType;
    confidence: number;
    taskType: TaskType;
    estimatedTokens: number;
}
export declare class PromptAnalyzer {
    private readonly SIMPLE_MAX_LENGTH;
    private readonly COMPLEX_MIN_LENGTH;
    private readonly REASONING_KEYWORDS;
    private readonly CREATIVITY_KEYWORDS;
    private readonly CODE_KEYWORDS;
    private readonly COMPLEX_INDICATORS;
    private readonly STOP_WORDS;
    /**
     * Analyze a prompt
     */
    analyze(prompt: string): PromptAnalysis;
    /**
     * Analyze multiple prompts
     */
    analyzeMultiple(prompts: string[]): PromptAnalysis[];
    /**
     * Detect if prompt requires specific capability
     */
    private detectRequirement;
    /**
     * Determine complexity level
     */
    private determineComplexity;
    /**
     * Extract meaningful keywords
     */
    private extractKeywords;
    /**
     * Classify task type
     */
    private classifyTask;
    /**
     * Recommend optimal model
     */
    private recommendModel;
    /**
     * Calculate confidence score
     */
    private calculateConfidence;
    /**
     * Estimate token count (rough approximation)
     */
    private estimateTokens;
}
//# sourceMappingURL=PromptAnalyzer.d.ts.map