/**
 * AdvancedCodeAnalyzer
 *
 * Enhanced code analysis using AST parsing and advanced metrics.
 * Extends base CodeAnalyzer capabilities.
 */
export interface ASTNode {
    type: string;
    children?: ASTNode[];
    value?: any;
}
export interface CodeSmell {
    type: string;
    severity: 'low' | 'medium' | 'high';
    location: {
        line: number;
        column: number;
    };
    description: string;
}
export interface DependencyGraph {
    nodes: string[];
    edges: Array<{
        from: string;
        to: string;
    }>;
}
export interface FileContent {
    path: string;
    content: string;
}
export declare class AdvancedCodeAnalyzer {
    parseAST(code: string, language: string): ASTNode;
    detectCodeSmells(code: string): CodeSmell[];
    buildDependencyGraph(files: FileContent[]): DependencyGraph;
    detectCircularDependencies(graph: DependencyGraph): string[][];
    calculateCognitiveComplexity(code: string): number;
    detectDuplication(codeBlocks: string[]): Array<{
        blocks: number[];
        similarity: number;
    }>;
    private calculateSimilarity;
}
//# sourceMappingURL=AdvancedCodeAnalyzer.d.ts.map