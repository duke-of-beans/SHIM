/**
 * Integration Tests - Self-Evolution Pipeline
 *
 * End-to-end testing of the complete self-evolution workflow.
 */

import { CodeAnalyzer } from './CodeAnalyzer';
import { ImprovementIdentifier } from './ImprovementIdentifier';
import { CodeGenerator } from './CodeGenerator';
import { SelfDeployer } from './SelfDeployer';
import { AdvancedCodeAnalyzer } from './AdvancedCodeAnalyzer';
import { PerformanceOptimizer } from './PerformanceOptimizer';

describe('Self-Evolution Integration Tests', () => {
  describe('Complete Pipeline', () => {
    it('should execute full self-evolution cycle', async () => {
      // 1. Code Analysis
      const analyzer = new CodeAnalyzer();
      const code = `
        function complexFunction(a, b, c, d, e, f) {
          if (a) {
            for (let i = 0; i < b; i++) {
              if (c) {
                console.log(d, e, f);
              }
            }
          }
          return true;
        }
      `;

      const analysis = analyzer.analyzeCode(code, 'test.ts');
      expect(analysis.metrics.cyclomaticComplexity).toBeGreaterThan(1);

      // 2. Improvement Identification
      const identifier = new ImprovementIdentifier();
      const improvements = identifier.identifyImprovements(analysis);

      expect(improvements.length).toBeGreaterThan(0);

      // 3. Code Generation
      const generator = new CodeGenerator();
      const modifications = generator.generateModifications(improvements[0]);

      expect(modifications.length).toBeGreaterThan(0);

      // 4. Deployment
      const deployer = new SelfDeployer({ requireApproval: false });
      const plan = deployer.createDeploymentPlan(modifications);

      expect(plan.stages.length).toBeGreaterThan(0);
    });

    it('should handle multiple files concurrently', async () => {
      const optimizer = new PerformanceOptimizer();
      const analyzer = new CodeAnalyzer();

      const files = [
        { path: 'file1.ts', content: 'const x = 1;' },
        { path: 'file2.ts', content: 'const y = 2;' },
        { path: 'file3.ts', content: 'const z = 3;' },
      ];

      const tasks = files.map((f, i) => ({
        id: `task${i}`,
        filePath: f.path,
        type: 'analysis',
      }));

      const results = await optimizer.analyzeParallel(tasks);
      expect(results.length).toBe(3);
    });

    it('should detect and resolve conflicts', async () => {
      const generator = new CodeGenerator();

      const improvement1 = {
        id: 'imp-1',
        type: 'refactoring' as const,
        description: 'Refactor 1',
        priority: 'high' as const,
        impact: 8,
        effort: 4,
        roi: 2,
        category: 'performance' as const,
        filePath: 'test.ts',
        lineNumber: 10,
      };

      const improvement2 = {
        id: 'imp-2',
        type: 'refactoring' as const,
        description: 'Refactor 2',
        priority: 'high' as const,
        impact: 8,
        effort: 4,
        roi: 2,
        category: 'performance' as const,
        filePath: 'test.ts', // Same file
        lineNumber: 10,
      };

      const mods1 = generator.generateModifications(improvement1);
      const mods2 = generator.generateModifications(improvement2);

      expect(mods1.length).toBeGreaterThan(0);
      expect(mods2.length).toBeGreaterThan(0);
    });
  });

  describe('Advanced Analysis Integration', () => {
    it('should use AST analysis for deeper insights', () => {
      const advanced = new AdvancedCodeAnalyzer();
      const code = 'function test() { return 42; }';

      const ast = advanced.parseAST(code, 'typescript');
      expect(ast.type).toBe('Program');

      const smells = advanced.detectCodeSmells(code);
      expect(Array.isArray(smells)).toBe(true);
    });

    it('should detect circular dependencies', () => {
      const advanced = new AdvancedCodeAnalyzer();

      const files = [
        { path: 'a.ts', content: 'import { B } from "./b";' },
        { path: 'b.ts', content: 'import { A } from "./a";' },
      ];

      const graph = advanced.buildDependencyGraph(files);
      const cycles = advanced.detectCircularDependencies(graph);

      expect(cycles.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization Integration', () => {
    it('should cache analysis results', () => {
      const optimizer = new PerformanceOptimizer();
      const analyzer = new CodeAnalyzer();

      const code = 'const x = 1;';
      const cacheKey = 'test.ts';

      // First analysis
      const analysis1 = analyzer.analyzeCode(code, 'test.ts');
      optimizer.cacheResult(cacheKey, analysis1);

      // Retrieve from cache
      const cached = optimizer.getCachedResult(cacheKey);
      expect(cached).toEqual(analysis1);
    });

    it('should batch small tasks for efficiency', async () => {
      const optimizer = new PerformanceOptimizer();

      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `task${i}`,
        filePath: `file${i}.ts`,
        type: 'simple',
      }));

      const batched = optimizer.batchTasks(tasks, 3);
      expect(batched.length).toBe(4); // ceil(10/3)
    });
  });
});
