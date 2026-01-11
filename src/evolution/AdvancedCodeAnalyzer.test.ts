/**
 * AdvancedCodeAnalyzer Tests
 *
 * Enhanced code analysis using AST parsing and advanced metrics.
 * Extends base CodeAnalyzer with deeper insights.
 */

import { AdvancedCodeAnalyzer, ASTNode, CodeSmell, DependencyGraph } from './AdvancedCodeAnalyzer';

describe('AdvancedCodeAnalyzer', () => {
  let analyzer: AdvancedCodeAnalyzer;

  beforeEach(() => {
    analyzer = new AdvancedCodeAnalyzer();
  });

  describe('Construction', () => {
    it('should create AdvancedCodeAnalyzer instance', () => {
      expect(analyzer).toBeInstanceOf(AdvancedCodeAnalyzer);
    });
  });

  describe('AST Parsing', () => {
    it('should parse TypeScript code into AST', () => {
      const code = 'function test() { return 42; }';
      const ast = analyzer.parseAST(code, 'typescript');

      expect(ast).toBeDefined();
      expect(ast.type).toBe('Program');
    });

    it('should detect syntax errors', () => {
      const code = 'function test() { return 42';
      expect(() => analyzer.parseAST(code, 'typescript')).toThrow();
    });
  });

  describe('Code Smell Detection', () => {
    it('should detect god class pattern', () => {
      const code = `
        class GodClass {
          method1() {}
          method2() {}
          method3() {}
          method4() {}
          method5() {}
          method6() {}
          method7() {}
          method8() {}
          method9() {}
          method10() {}
        }
      `;

      const smells = analyzer.detectCodeSmells(code);
      const godClass = smells.find((s) => s.type === 'god-class');

      expect(godClass).toBeDefined();
    });

    it('should detect long parameter lists', () => {
      const code = 'function test(a, b, c, d, e, f, g) { return a; }';
      const smells = analyzer.detectCodeSmells(code);
      const longParams = smells.find((s) => s.type === 'long-parameter-list');

      expect(longParams).toBeDefined();
    });
  });

  describe('Dependency Analysis', () => {
    it('should build dependency graph', () => {
      const files = [
        { path: 'a.ts', content: 'import { B } from "./b";' },
        { path: 'b.ts', content: 'export class B {}' },
      ];

      const graph = analyzer.buildDependencyGraph(files);

      expect(graph.nodes.length).toBe(2);
      expect(graph.edges.length).toBeGreaterThan(0);
    });

    it('should detect circular dependencies', () => {
      const files = [
        { path: 'a.ts', content: 'import { B } from "./b";' },
        { path: 'b.ts', content: 'import { A } from "./a";' },
      ];

      const graph = analyzer.buildDependencyGraph(files);
      const cycles = analyzer.detectCircularDependencies(graph);

      expect(cycles.length).toBeGreaterThan(0);
    });
  });

  describe('Cognitive Complexity', () => {
    it('should calculate cognitive complexity', () => {
      const code = `
        function complex() {
          if (a) {
            for (let i = 0; i < 10; i++) {
              if (b) {
                while (c) {
                  if (d) {
                    return true;
                  }
                }
              }
            }
          }
          return false;
        }
      `;

      const complexity = analyzer.calculateCognitiveComplexity(code);
      expect(complexity).toBeGreaterThan(5);
    });
  });

  describe('Code Duplication', () => {
    it('should detect duplicate code blocks', () => {
      const code1 = 'function test() { const x = 1; return x * 2; }';
      const code2 = 'function other() { const x = 1; return x * 2; }';

      const duplicates = analyzer.detectDuplication([code1, code2]);
      expect(duplicates.length).toBeGreaterThan(0);
    });
  });
});
