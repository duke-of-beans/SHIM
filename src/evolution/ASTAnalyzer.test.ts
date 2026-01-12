/**
 * ASTAnalyzer Tests
 *
 * Advanced code analysis using Abstract Syntax Tree parsing.
 * Following TDD: Test file created FIRST, implementation SECOND.
 */

import { ASTAnalyzer, ASTMetrics, ASTIssue } from './ASTAnalyzer';

describe('ASTAnalyzer', () => {
  let analyzer: ASTAnalyzer;

  beforeEach(() => {
    analyzer = new ASTAnalyzer();
  });

  describe('Construction', () => {
    it('should create ASTAnalyzer instance', () => {
      expect(analyzer).toBeInstanceOf(ASTAnalyzer);
    });
  });

  describe('AST Parsing', () => {
    it('should parse TypeScript code', () => {
      const code = 'function test() { return 42; }';
      const ast = analyzer.parse(code, 'typescript');

      expect(ast).toBeDefined();
      expect(ast.type).toBe('SourceFile');
    });

    it('should detect syntax errors', () => {
      const code = 'function test() { return 42';
      
      expect(() => analyzer.parse(code, 'typescript')).toThrow();
    });
  });

  describe('Function Analysis', () => {
    it('should extract function information', () => {
      const code = `
        function add(a: number, b: number): number {
          return a + b;
        }
      `;

      const functions = analyzer.extractFunctions(code);
      expect(functions.length).toBe(1);
      expect(functions[0].name).toBe('add');
      expect(functions[0].parameters).toBe(2);
    });

    it('should detect complex functions', () => {
      const code = `
        function complex(x: number): number {
          if (x > 0) {
            if (x > 10) {
              return x * 2;
            }
            return x;
          }
          return 0;
        }
      `;

      const functions = analyzer.extractFunctions(code);
      expect(functions[0].complexity).toBeGreaterThan(1);
    });
  });

  describe('Dependency Analysis', () => {
    it('should extract imports', () => {
      const code = `
        import { foo } from './foo';
        import bar from './bar';
      `;

      const imports = analyzer.extractImports(code);
      expect(imports.length).toBe(2);
    });

    it('should detect circular dependencies', () => {
      const files = {
        './a.ts': "import { b } from './b';",
        './b.ts': "import { a } from './a';",
      };

      const circular = analyzer.detectCircularDeps(files);
      expect(circular.length).toBeGreaterThan(0);
    });
  });

  describe('Code Smell Detection', () => {
    it('should detect long parameter lists', () => {
      const code = `
        function many(a, b, c, d, e, f, g) {
          return a + b + c + d + e + f + g;
        }
      `;

      const issues = analyzer.detectSmells(code);
      const longParams = issues.find((i) => i.type === 'long-parameter-list');
      expect(longParams).toBeDefined();
    });

    it('should detect dead code', () => {
      const code = `
        function test() {
          return 42;
          console.log('unreachable');
        }
      `;

      const issues = analyzer.detectSmells(code);
      const deadCode = issues.find((i) => i.type === 'dead-code');
      expect(deadCode).toBeDefined();
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate AST metrics', () => {
      const code = `
        function test() {
          if (true) {
            return 1;
          }
          return 0;
        }
      `;

      const metrics = analyzer.calculateMetrics(code);
      expect(metrics.nodes).toBeGreaterThan(0);
      expect(metrics.depth).toBeGreaterThan(0);
    });
  });
});
