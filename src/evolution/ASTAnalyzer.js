"use strict";
/**
 * ASTAnalyzer
 *
 * Advanced code analysis using Abstract Syntax Tree.
 * Part of Advanced CodeAnalyzer enhancements.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTAnalyzer = void 0;
const ts = __importStar(require("typescript"));
class ASTAnalyzer {
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
exports.ASTAnalyzer = ASTAnalyzer;
//# sourceMappingURL=ASTAnalyzer.js.map