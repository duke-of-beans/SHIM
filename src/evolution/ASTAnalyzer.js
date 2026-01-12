/**
 * ASTAnalyzer
 *
 * Advanced code analysis using Abstract Syntax Tree.
 * Part of Advanced CodeAnalyzer enhancements.
 */
// @ts-ignore - TypeScript module available at runtime but not in MCP build
import * as ts from 'typescript';
export class ASTAnalyzer {
    parse(code, language) {
        if (language === 'typescript') {
            const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);
            // Check for syntax errors
            const diagnostics = sourceFile.parseDiagnostics;
            if (diagnostics && diagnostics.length > 0) {
                throw new Error('Syntax error in code');
            }
            return this.convertToASTNode(sourceFile);
        }
        throw new Error(`Unsupported language: ${language}`);
    }
    extractFunctions(code) {
        const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);
        const functions = [];
        const visit = (node) => {
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
    extractImports(code) {
        const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);
        const imports = [];
        const visit = (node) => {
            if (ts.isImportDeclaration(node)) {
                const moduleSpecifier = node.moduleSpecifier.text;
                const specifiers = [];
                if (node.importClause) {
                    if (node.importClause.name) {
                        specifiers.push(node.importClause.name.text);
                    }
                    if (node.importClause.namedBindings) {
                        const bindings = node.importClause.namedBindings;
                        if (ts.isNamedImports(bindings)) {
                            bindings.elements.forEach((el) => {
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
    detectCircularDeps(files) {
        const graph = {};
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
        const cycles = [];
        const visited = new Set();
        const stack = [];
        const dfs = (node) => {
            if (stack.includes(node)) {
                const cycleStart = stack.indexOf(node);
                const cyclePath = [...stack.slice(cycleStart), node];
                cycles.push(cyclePath.join(' -> '));
                return true;
            }
            if (visited.has(node))
                return false;
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
    detectSmells(code) {
        const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);
        const issues = [];
        const visit = (node) => {
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
                    const returnIndex = statements.indexOf(node);
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
    calculateMetrics(code) {
        const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);
        let nodes = 0;
        let depth = 0;
        let branches = 0;
        let currentDepth = 0;
        let maxDepth = 0;
        const visit = (node) => {
            nodes++;
            currentDepth++;
            maxDepth = Math.max(maxDepth, currentDepth);
            // Count branch points
            if (ts.isIfStatement(node) ||
                ts.isConditionalExpression(node) ||
                ts.isCaseClause(node)) {
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
    convertToASTNode(node) {
        const children = [];
        ts.forEachChild(node, (child) => {
            children.push(this.convertToASTNode(child));
        });
        return {
            type: ts.SyntaxKind[node.kind],
            children,
        };
    }
    calculateCyclomaticComplexity(node) {
        let complexity = 1;
        const visit = (n) => {
            if (ts.isIfStatement(n) ||
                ts.isWhileStatement(n) ||
                ts.isForStatement(n) ||
                ts.isCaseClause(n) ||
                ts.isConditionalExpression(n)) {
                complexity++;
            }
            ts.forEachChild(n, visit);
        };
        visit(node);
        return complexity;
    }
    countLines(node) {
        const text = node.getText();
        return text.split('\n').length;
    }
}
//# sourceMappingURL=ASTAnalyzer.js.map