/**
 * CodeAnalyzer
 *
 * Analyze codebase structure, metrics, and quality for self-improvement.
 * Provides insights into complexity, maintainability, and technical debt.
 *
 * Part of Phase 6: Self-Evolution Engine
 * Component 1/4
 */
export interface CodeAnalyzerConfig {
    maxComplexity?: number;
    minCoverage?: number;
    maxFunctionLength?: number;
}
export interface CodeSmell {
    type: 'long-function' | 'high-complexity' | 'duplication' | 'todo' | 'fixme';
    severity: 'low' | 'medium' | 'high' | 'critical';
    location: string;
    description: string;
}
export interface TechnicalDebt {
    type: 'TODO' | 'FIXME' | 'HACK' | 'XXX';
    line: number;
    description: string;
}
export interface FileMetrics {
    path: string;
    linesOfCode: number;
    complexity: number;
    maintainabilityIndex: number;
    imports?: string[];
    codeSmells?: CodeSmell[];
    technicalDebt?: TechnicalDebt[];
}
export interface DirectoryAnalysis {
    totalFiles: number;
    totalLinesOfCode: number;
    averageComplexity: number;
    fileMetrics: FileMetrics[];
}
export interface AnalysisReport {
    summary: {
        totalFiles: number;
        totalLOC: number;
        averageComplexity: number;
        maintainabilityScore: number;
    };
    metrics: FileMetrics[];
    issues: Array<{
        severity: 'low' | 'medium' | 'high' | 'critical';
        type: string;
        file: string;
        description: string;
    }>;
    recommendations: string[];
}
export declare class CodeAnalyzer {
    private config;
    private cache;
    constructor(config?: CodeAnalyzerConfig);
    /**
     * Analyze a single file
     */
    analyzeFile(filePath: string, fileContent: string): Promise<FileMetrics>;
    /**
     * Analyze a directory
     */
    analyzeDirectory(dirPath: string, options?: {
        includeExtensions?: string[];
        excludePatterns?: string[];
    }): Promise<DirectoryAnalysis>;
    /**
     * Generate comprehensive analysis report
     */
    generateReport(dirPath: string): Promise<AnalysisReport>;
    /**
     * Count lines of code (excluding comments and blank lines)
     */
    private countLOC;
    /**
     * Calculate cyclomatic complexity
     */
    private calculateComplexity;
    /**
     * Calculate maintainability index (0-100, higher is better)
     */
    private calculateMaintainability;
    /**
     * Extract import statements
     */
    private extractImports;
    /**
     * Detect code smells
     */
    private detectCodeSmells;
    /**
     * Find technical debt markers
     */
    private findTechnicalDebt;
    /**
     * Find files in directory
     */
    private findFiles;
    /**
     * Generate recommendations based on analysis
     */
    private generateRecommendations;
}
//# sourceMappingURL=CodeAnalyzer.d.ts.map