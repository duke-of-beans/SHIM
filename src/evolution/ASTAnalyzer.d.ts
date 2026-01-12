/**
 * ASTAnalyzer
 *
 * Advanced code analysis using Abstract Syntax Tree.
 * Part of Advanced CodeAnalyzer enhancements.
 */
export interface ASTNode {
    type: string;
    children: ASTNode[];
}
export interface FunctionInfo {
    name: string;
    parameters: number;
    complexity: number;
    loc: number;
}
export interface ImportInfo {
    module: string;
    specifiers: string[];
}
export interface ASTIssue {
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    line?: number;
}
export interface ASTMetrics {
    nodes: number;
    depth: number;
    branches: number;
}
export declare class ASTAnalyzer {
    parse(code: string, language: string): ASTNode;
    extractFunctions(code: string): FunctionInfo[];
    extractImports(code: string): ImportInfo[];
    detectCircularDeps(files: Record<string, string>): string[];
    detectSmells(code: string): ASTIssue[];
    calculateMetrics(code: string): ASTMetrics;
    private convertToASTNode;
    private calculateCyclomaticComplexity;
    private countLines;
}
//# sourceMappingURL=ASTAnalyzer.d.ts.map