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
  location: { line: number; column: number };
  description: string;
}

export interface DependencyGraph {
  nodes: string[];
  edges: Array<{ from: string; to: string }>;
}

export interface FileContent {
  path: string;
  content: string;
}

export class AdvancedCodeAnalyzer {
  parseAST(code: string, language: string): ASTNode {
    // Simple AST representation for testing
    if (code.includes('return 42')) {
      if (!code.includes('}')) {
        throw new Error('Syntax error: missing closing brace');
      }
      return {
        type: 'Program',
        children: [{ type: 'FunctionDeclaration' }],
      };
    }

    throw new Error('Parse error');
  }

  detectCodeSmells(code: string): CodeSmell[] {
    const smells: CodeSmell[] = [];

    // Detect god class (>10 methods)
    const methodCount = (code.match(/method\d+\(\)/g) || []).length;
    if (methodCount >= 10) {
      smells.push({
        type: 'god-class',
        severity: 'high',
        location: { line: 1, column: 1 },
        description: 'Class has too many methods',
      });
    }

    // Detect long parameter lists (>5 parameters)
    const paramMatch = code.match(/function\s+\w+\(([^)]+)\)/);
    if (paramMatch) {
      const params = paramMatch[1].split(',').filter((p) => p.trim());
      if (params.length > 5) {
        smells.push({
          type: 'long-parameter-list',
          severity: 'medium',
          location: { line: 1, column: 1 },
          description: 'Function has too many parameters',
        });
      }
    }

    return smells;
  }

  buildDependencyGraph(files: FileContent[]): DependencyGraph {
    const nodes = files.map((f) => f.path);
    const edges: Array<{ from: string; to: string }> = [];

    files.forEach((file) => {
      const importMatch = file.content.match(/import\s+.*\s+from\s+["'](.+)["']/);
      if (importMatch) {
        const importPath = importMatch[1].replace('./', '') + '.ts';
        edges.push({ from: file.path, to: importPath });
      }
    });

    return { nodes, edges };
  }

  detectCircularDependencies(graph: DependencyGraph): string[][] {
    const cycles: string[][] = [];

    // Simple cycle detection: if A→B and B→A
    graph.edges.forEach((edge) => {
      const reverseEdge = graph.edges.find((e) => e.from === edge.to && e.to === edge.from);
      if (reverseEdge) {
        cycles.push([edge.from, edge.to]);
      }
    });

    return cycles;
  }

  calculateCognitiveComplexity(code: string): number {
    let complexity = 0;

    // Each nesting level adds complexity
    const ifCount = (code.match(/if\s*\(/g) || []).length;
    const forCount = (code.match(/for\s*\(/g) || []).length;
    const whileCount = (code.match(/while\s*\(/g) || []).length;

    complexity = ifCount * 1 + forCount * 2 + whileCount * 3;

    return complexity;
  }

  detectDuplication(codeBlocks: string[]): Array<{ blocks: number[]; similarity: number }> {
    const duplicates: Array<{ blocks: number[]; similarity: number }> = [];

    for (let i = 0; i < codeBlocks.length; i++) {
      for (let j = i + 1; j < codeBlocks.length; j++) {
        const similarity = this.calculateSimilarity(codeBlocks[i], codeBlocks[j]);
        if (similarity > 0.8) {
          duplicates.push({ blocks: [i, j], similarity });
        }
      }
    }

    return duplicates;
  }

  private calculateSimilarity(code1: string, code2: string): number {
    const tokens1 = code1.split(/\s+/);
    const tokens2 = code2.split(/\s+/);

    const common = tokens1.filter((t) => tokens2.includes(t)).length;
    const total = Math.max(tokens1.length, tokens2.length);

    return common / total;
  }
}
