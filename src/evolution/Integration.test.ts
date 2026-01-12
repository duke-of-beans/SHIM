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
        function processData(a, b, c, d, e, f, g, h) {
          if (a > 0) {
            if (b > 0) {
              if (c > 0) {
                return a + b + c + d + e + f + g + h;
              }
            }
          }
          return 0;
        }
      `;

      const analysisResult = analyzer.analyzeCode(complexCode, 'test.ts');

      expect(analysisResult.issues.length).toBeGreaterThan(0);
      expect(analysisResult.metrics.complexity).toBeGreaterThan(1);

      // 2. IDENTIFY: Find improvement opportunities
      const improvements = identifier.identifyImprovements(analysisResult);

      expect(improvements.length).toBeGreaterThan(0);

      const topImprovement = identifier.rankByPriority(improvements)[0];
      expect(topImprovement).toBeDefined();

      // 3. GENERATE: Create code modifications
      const modifications = generator.generateModifications(topImprovement);

      expect(modifications.length).toBeGreaterThan(0);
      expect(modifications[0].file).toBe('test.ts');

      // 4. DEPLOY: Execute deployment plan
      const plan = deployer.createDeploymentPlan(modifications);

      expect(plan.stages.length).toBeGreaterThan(0);
      expect(plan.stages).toContain('validate');
      expect(plan.stages).toContain('test');
      expect(plan.stages).toContain('deploy');
    });

    it('should integrate AST analysis into pipeline', () => {
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
      const analysisResult = analyzer.analyzeCode(code, 'dup.ts');

      // Combined insights
      const allIssues = [
        ...analysisResult.issues,
        ...smells.map((s) => ({
          type: s.type,
          severity: s.severity,
          message: s.message,
          file: 'dup.ts',
          line: s.line || 0,
        })),
      ];

      expect(allIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    it('should handle analysis failures gracefully', () => {
      const invalidCode = 'function test() {';

      const result = analyzer.analyzeCode(invalidCode, 'broken.ts');

      // Should still return a result object
      expect(result).toBeDefined();
      expect(result.file).toBe('broken.ts');
    });

    it('should rollback failed deployments', () => {
      const mod = {
        id: 'mod-1',
        file: 'test.ts',
        type: 'refactor' as const,
        content: 'invalid syntax {{{',
      };

      const plan = deployer.createDeploymentPlan([mod]);
      const result = deployer.executePlan(plan);

      expect(result.status).toBe('failed');

      // Rollback capability exists
      const rollback = deployer.getRollbackHistory();
      expect(rollback).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete analysis quickly', () => {
      const code = `
        function simple() {
          return 42;
        }
      `;

      const start = Date.now();
      analyzer.analyzeCode(code, 'simple.ts');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // <100ms
    });

    it('should handle large codebases', () => {
      // Generate large code sample
      const lines = Array(1000)
        .fill('console.log("test");')
        .join('\n');

      const code = `function large() {\n${lines}\n}`;

      const start = Date.now();
      const result = analyzer.analyzeCode(code, 'large.ts');
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // <1s for 1000 lines
    });
  });
});
