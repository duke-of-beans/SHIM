/**
 * CodeGenerator
 *
 * Generate code modifications to implement identified improvements.
 * Provides safe, validated code transformations with rollback support.
 *
 * Part of Phase 6: Self-Evolution Engine
 * Component 3/4
 */
import { Improvement } from './ImprovementIdentifier';
export type ModificationType = 'refactor' | 'optimize' | 'add' | 'remove';
export interface CodeModification {
    id: string;
    type: ModificationType;
    filePath: string;
    description: string;
    originalCode: string;
    modifiedCode: string;
    diff: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface CodeGeneratorConfig {
    maxModificationsPerFile?: number;
    requireTests?: boolean;
}
export declare class CodeGenerator {
    private config;
    private modificationCounter;
    private history;
    constructor(config?: CodeGeneratorConfig);
    /**
     * Generate modifications from improvement
     */
    generateModifications(improvement: Improvement): CodeModification[];
    /**
     * Generate code from template
     */
    generateFromTemplate(templateName: string, params: Record<string, any>): string;
    /**
     * Generate diff between original and modified code
     */
    generateDiff(original: string, modified: string): string;
    /**
     * Validate code modification
     */
    validateModification(modification: CodeModification): ValidationResult;
    /**
     * Track modification in history
     */
    trackModification(modification: CodeModification): void;
    /**
     * Get modification history
     */
    getModificationHistory(): CodeModification[];
    /**
     * Generate rollback modification
     */
    generateRollback(modificationId: string): CodeModification | null;
    /**
     * Generate tests for code
     */
    generateTests(code: string): string;
    /**
     * Generate batch modifications
     */
    generateBatch(improvements: Improvement[]): CodeModification[];
    /**
     * Group modifications by file
     */
    groupModificationsByFile(modifications: CodeModification[]): Record<string, CodeModification[]>;
    /**
     * Generate refactoring modification
     */
    private generateRefactoring;
    /**
     * Generate optimization modification
     */
    private generateOptimization;
    /**
     * Generate test addition
     */
    private generateTestAddition;
    /**
     * Generate maintainability fix
     */
    private generateMaintainabilityFix;
    /**
     * Generate generic fix
     */
    private generateGenericFix;
    /**
     * Check for basic syntax errors
     */
    private hasSyntaxError;
    /**
     * Generate unique modification ID
     */
    private generateId;
}
//# sourceMappingURL=CodeGenerator.d.ts.map