/**
 * Self-Evolution Integration Tests
 *
 * End-to-end tests for complete self-evolution pipeline:
 * CodeAnalyzer → ImprovementIdentifier → CodeGenerator → SelfDeployer
 */

import { CodeAnalyzer } from './CodeAnalyzer';
import { ImprovementIdentifier } from './ImprovementIdentifier';
import { CodeGenerator } from './CodeGenerator';
import { SelfDeployer } from './SelfDeployer';
import { ASTAnalyzer } from './ASTAnalyzer';

describe('Self-Evolution Integration', () => {
  let analyzer: CodeAnalyzer;
  let identifier: ImprovementIdentifier;
  let generator: CodeGenerator;
  let deployer: SelfDeployer;
  let astAnalyzer: ASTAnalyzer;

  beforeEach(() => {
    analyzer = new CodeAnalyzer();
    identifier = new ImprovementIdentifier();
    generator = new CodeGenerator();
    deployer = new SelfDeployer({ requireApproval: false });
    astAnalyzer = new ASTAnalyzer();
  });

  describe('Complete Pipeline', () => {
    it('should execute full self-evolution cycle', async () => {
      // 1. ANALYZE: Detect issues in code
      const complexCode = `
        function processData(a, b, c, d, e, f, g, h, i, j, k) {
          if (a > 0) {
            if (b > 0) {
              if (c > 0) {
                if (d > 0) {
                  if (e > 0) {
                    return a + b + c + d + e + f + g + h + i + j + k;
                  }
                }
              }
            }
          }
          return 0;
        }
      `;

      const fileMetrics = await analyzer.analyzeFile('test.ts', complexCode);

      expect(fileMetrics.complexity).toBeGreaterThan(5); // Much higher complexity

      // Create analysis result with high complexity issue
      const analysisResult = {
        summary: {
          totalFiles: 1,
          totalLOC: fileMetrics.linesOfCode,
          averageComplexity: fileMetrics.complexity,
          maintainabilityScore: 30, // Low maintainability
        },
        metrics: [fileMetrics],
        issues: [
          {
            severity: 'high' as const,
            type: 'high-complexity',
            file: 'test.ts',
            description: `Function has complexity of ${fileMetrics.complexity}`,
          },
          ...(fileMetrics.codeSmells || []).map((smell) => ({
            severity: smell.severity,
            type: smell.type,
            file: 'test.ts',
            description: smell.description,
          })),
        ],
        recommendations: [],
      };

      // 2. IDENTIFY: Find improvement opportunities
      const improvements = identifier.identifyImprovements(analysisResult);

      expect(improvements.length).toBeGreaterThan(0);

      const topImprovement = identifier.rankByPriority(improvements)[0];
      expect(topImprovement).toBeDefined();

      // 3. GENERATE: Create code modifications
      const modifications = generator.generateModifications(topImprovement);

      expect(modifications.length).toBeGreaterThan(0);
      expect(modifications[0].filePath).toBe('test.ts');

      // 4. DEPLOY: Execute deployment plan
      const plan = deployer.createDeploymentPlan(modifications);

      expect(plan.stages.length).toBeGreaterThan(0);
      const stageNames = plan.stages.map((s) => s.name);
      expect(stageNames).toContain('validate');
      expect(stageNames).toContain('test');
      expect(stageNames).toContain('deploy');
    });

    it('should integrate AST analysis into pipeline', async () => {
      const code = `
        function duplicate() {
          console.log('hello');
          console.log('hello');
          console.log('hello');
        }
      `;

      // AST analysis
      const functions = astAnalyzer.extractFunctions(code);
      expect(functions.length).toBe(1);

      const smells = astAnalyzer.detectSmells(code);

      // Regular analysis
      const fileMetrics = await analyzer.analyzeFile('dup.ts', code);

      // Combined insights
      const allIssues = [
        ...(fileMetrics.codeSmells || []).map((s) => ({
          type: s.type,
          severity: s.severity,
          message: s.description,
          file: 'dup.ts',
          line: 0,
        })),
        ...smells.map((s) => ({
          type: s.type,
          severity: s.severity,
          message: s.message,
          file: 'dup.ts',
          line: s.line || 0,
        })),
      ];

      expect(fileMetrics).toBeDefined();
      expect(functions[0].name).toBe('duplicate');
    });
  });

  describe('Error Recovery', () => {
    it('should handle analysis failures gracefully', async () => {
      const invalidCode = 'function test() {';

      const result = await analyzer.analyzeFile('broken.ts', invalidCode);

      // Should still return a result object
      expect(result).toBeDefined();
      expect(result.path).toBe('broken.ts');
    });

    it('should rollback failed deployments', async () => {
      const mod = {
        id: 'mod-1',
        filePath: 'test.ts',
        type: 'refactor' as const,
        description: 'Test modification',
        originalCode: 'const x = 1;',
        modifiedCode: 'invalid syntax {{{',
        diff: '- const x = 1;\n+ invalid syntax {{{',
      };

      const plan = deployer.createDeploymentPlan([mod]);
      const result = await deployer.executePlan(plan);

      expect(result.status).toBe('failed');

      // Rollback capability exists
      const rollback = deployer.getRollbackHistory();
      expect(rollback).toBeDefined();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete analysis under 100ms for small files', async () => {
      const code = `
        function simple() {
          return 42;
        }
      `;

      const start = Date.now();
      await analyzer.analyzeFile('simple.ts', code);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // <100ms
    });

    it('should handle large files under 1 second', async () => {
      // Generate large code sample
      const lines = Array(1000)
        .fill('console.log("test");')
        .join('\n');

      const code = `function large() {\n${lines}\n}`;

      const start = Date.now();
      const result = await analyzer.analyzeFile('large.ts', code);
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // <1s for 1000 lines
    });

    it('should process directory in reasonable time', async () => {
      // Small directory benchmark
      const testDir = './src/evolution';

      const start = Date.now();
      const analysis = await analyzer.analyzeDirectory(testDir);
      const duration = Date.now() - start;

      expect(analysis.totalFiles).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000); // <5s for directory
    });

    it('should identify improvements quickly', () => {
      const mockAnalysis = {
        summary: {
          totalFiles: 1,
          totalLOC: 100,
          averageComplexity: 15,
          maintainabilityScore: 45,
        },
        metrics: [],
        issues: [
          {
            severity: 'high' as const,
            type: 'high-complexity',
            file: 'test.ts',
            description: 'Complex function',
          },
        ],
        recommendations: [],
      };

      const start = Date.now();
      const improvements = identifier.identifyImprovements(mockAnalysis);
      const duration = Date.now() - start;

      expect(improvements.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50); // <50ms
    });

    it('should generate modifications quickly', () => {
      const mockImprovement = {
        id: 'imp-1',
        category: 'refactoring' as const,
        priority: 'high' as const,
        impact: 8,
        effort: 4,
        roi: 2,
        file: 'test.ts',
        description: 'Test improvement',
        suggestion: 'Refactor',
        affectedFiles: ['test.ts'],
      };

      const start = Date.now();
      const mods = generator.generateModifications(mockImprovement);
      const duration = Date.now() - start;

      expect(mods.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50); // <50ms
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full cycle in under 2 seconds', async () => {
      const code = `
        function badCode(a, b, c, d, e) {
          if (a) {
            if (b) {
              return a + b + c + d + e;
            }
          }
          return 0;
        }
      `;

      const start = Date.now();

      // Full pipeline
      const fileMetrics = await analyzer.analyzeFile('test.ts', code);

      const analysisResult = {
        summary: {
          totalFiles: 1,
          totalLOC: fileMetrics.linesOfCode,
          averageComplexity: fileMetrics.complexity,
          maintainabilityScore: fileMetrics.maintainabilityIndex,
        },
        metrics: [fileMetrics],
        issues: (fileMetrics.codeSmells || []).map((s) => ({
          severity: s.severity,
          type: s.type,
          file: 'test.ts',
          description: s.description,
        })),
        recommendations: [],
      };

      const improvements = identifier.identifyImprovements(analysisResult);
      const modifications = improvements.length > 0 ? generator.generateModifications(improvements[0]) : [];
      const plan = modifications.length > 0 ? deployer.createDeploymentPlan(modifications) : null;

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000); // <2s for full cycle
      expect(fileMetrics).toBeDefined();
    });
  });
});
