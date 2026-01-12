/**
 * ASTAnalyzer
 *
 * Advanced code analysis using Abstract Syntax Tree.
 * Part of Advanced CodeAnalyzer enhancements.
 */

// @ts-ignore - TypeScript module available at runtime but not in MCP build
import * as ts from 'typescript';

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

export class ASTAnalyzer {
  parse(code: string, language: string): ASTNode {
    if (language === 'typescript') {
      const sourceFile = ts.createSourceFile(
        'temp.ts',
        code,
        ts.ScriptTarget.Latest,
        true
      );

      // Check for syntax errors
      const diagnostics = (sourceFile as any).parseDiagnostics;
      if (diagnostics && diagnostics.length > 0) {
        throw new Error('Syntax error in code');
      }

      return this.convertToASTNode(sourceFile);
    }

    throw new Error(`Unsupported language: ${language}`);
  }

  extractFunctions(code: string): FunctionInfo[] {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);
    const functions: FunctionInfo[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const complexity = this.calculateCyclomaticComplexity(node);
        const loc = this.countLines(node);

        functions.push({
          name: node.name.text,
          parameters: node.parameters?.length || 0,
          complexity,
          loc,
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return functions;
  }

  extractImports(code: string): ImportInfo[] {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);
    const imports: ImportInfo[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
        const specifiers: string[] = [];

        if (node.importClause) {
          if (node.importClause.name) {
            specifiers.push(node.importClause.name.text);
          }
          if (node.importClause.namedBindings) {
            const bindings = node.importClause.namedBindings;
            if (ts.isNamedImports(bindings)) {
              bindings.elements.forEach((el: any) => {
                specifiers.push(el.name.text);
              });
            }
          }
        }

        imports.push({ module: moduleSpecifier, specifiers });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return imports;
  }

  detectCircularDeps(files: Record<string, string>): string[] {
    const graph: Record<string, string[]> = {};

    // Build dependency graph
    Object.entries(files).forEach(([filename, code]) => {
      const imports = this.extractImports(code);
      // Normalize paths
      graph[filename] = imports.map((i) => {
        const module = i.module;
        // Handle relative imports
        if (module.startsWith('./') || module.startsWith('../')) {
          return module + '.ts';
        }
        return module;
      });
    });

    // Detect cycles
    const cycles: string[] = [];
    const visited = new Set<string>();
    const stack: string[] = [];

    const dfs = (node: string): boolean => {
      if (stack.includes(node)) {
        const cycleStart = stack.indexOf(node);
        const cyclePath = [...stack.slice(cycleStart), node];
        cycles.push(cyclePath.join(' -> '));
        return true;
      }

      if (visited.has(node)) return false;

      visited.add(node);
      stack.push(node);

      const deps = graph[node] || [];
      for (const dep of deps) {
        dfs(dep);
      }

      stack.pop();
      return false;
    };

    Object.keys(graph).forEach((file) => {
      if (!visited.has(file)) {
        dfs(file);
      }
    });

    return cycles;
  }

  detectSmells(code: string): ASTIssue[] {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);
    const issues: ASTIssue[] = [];

    const visit = (node: ts.Node) => {
      // Long parameter list
      if (ts.isFunctionDeclaration(node) && node.parameters && node.parameters.length > 5) {
        issues.push({
          type: 'long-parameter-list',
          severity: 'medium',
          message: `Function has ${node.parameters.length} parameters`,
        });
      }

      // Dead code after return
      if (ts.isReturnStatement(node) && node.parent) {
        const parent = node.parent;
        if (ts.isBlock(parent) && parent.statements) {
          const statements = parent.statements;
          const returnIndex = statements.indexOf(node as ts.Statement);
          if (returnIndex >= 0 && returnIndex < statements.length - 1) {
            issues.push({
              type: 'dead-code',
              severity: 'high',
              message: 'Unreachable code after return',
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return issues;
  }

  calculateMetrics(code: string): ASTMetrics {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);

    let nodes = 0;
    let depth = 0;
    let branches = 0;
    let currentDepth = 0;
    let maxDepth = 0;

    const visit = (node: ts.Node) => {
      nodes++;
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);

      // Count branch points
      if (
        ts.isIfStatement(node) ||
        ts.isConditionalExpression(node) ||
        ts.isCaseClause(node)
      ) {
        branches++;
      }

      ts.forEachChild(node, visit);
      currentDepth--;
    };

    visit(sourceFile);

    return {
      nodes,
      depth: maxDepth,
      branches,
    };
  }

  private convertToASTNode(node: ts.Node): ASTNode {
    const children: ASTNode[] = [];

    ts.forEachChild(node, (child: ts.Node) => {
      children.push(this.convertToASTNode(child));
    });

    return {
      type: ts.SyntaxKind[node.kind],
      children,
    };
  }

  private calculateCyclomaticComplexity(node: ts.Node): number {
    let complexity = 1;

    const visit = (n: ts.Node) => {
      if (
        ts.isIfStatement(n) ||
        ts.isWhileStatement(n) ||
        ts.isForStatement(n) ||
        ts.isCaseClause(n) ||
        ts.isConditionalExpression(n)
      ) {
        complexity++;
      }

      ts.forEachChild(n, visit);
    };

    visit(node);
    return complexity;
  }

  private countLines(node: ts.Node): number {
    const text = node.getText();
    return text.split('\n').length;
  }
}
