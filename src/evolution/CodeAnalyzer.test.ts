/**
 * CodeAnalyzer Tests
 *
 * Tests for autonomous codebase analysis.
 * Following TDD: Test file created FIRST, implementation SECOND.
 *
 * Purpose: Analyze codebase structure, metrics, and quality for self-improvement.
 */

import { CodeAnalyzer, AnalysisReport, FileMetrics, CodeSmell } from './CodeAnalyzer';

describe('CodeAnalyzer', () => {
  let analyzer: CodeAnalyzer;

  beforeEach(() => {
    analyzer = new CodeAnalyzer();
  });

  describe('Construction', () => {
    it('should create CodeAnalyzer instance', () => {
      expect(analyzer).toBeInstanceOf(CodeAnalyzer);
    });

    it('should accept custom configuration', () => {
      const customAnalyzer = new CodeAnalyzer({
        maxComplexity: 15,
        minCoverage: 90,
      });

      expect(customAnalyzer).toBeInstanceOf(CodeAnalyzer);
    });
  });

  describe('File Analysis', () => {
    it('should analyze a single file', async () => {
      const filePath = 'src/test-file.ts';
      const fileContent = `
        export class TestClass {
          public method1(): void {
            console.log('test');
          }
        }
      `;

      const metrics = await analyzer.analyzeFile(filePath, fileContent);

      expect(metrics).toHaveProperty('path');
      expect(metrics).toHaveProperty('linesOfCode');
      expect(metrics).toHaveProperty('complexity');
    });

    it('should count lines of code accurately', async () => {
      const fileContent = `
        // Comment line
        export class Test {
          method() {
            return 42;
          }
        }
      `;

      const metrics = await analyzer.analyzeFile('test.ts', fileContent);

      expect(metrics.linesOfCode).toBeGreaterThan(0);
    });

    it('should exclude comments and blank lines from LOC', async () => {
      const fileContent = `
        // This is a comment
        
        export const value = 42;
        
        /* Multi-line
           comment */
      `;

      const metrics = await analyzer.analyzeFile('test.ts', fileContent);

      expect(metrics.linesOfCode).toBeLessThan(10); // Should only count actual code
    });

    it('should calculate cyclomatic complexity', async () => {
      const fileContent = `
        export function complexFunction(x: number): number {
          if (x > 0) {
            if (x > 10) {
              return x * 2;
            }
            return x;
          }
          return 0;
        }
      `;

      const metrics = await analyzer.analyzeFile('test.ts', fileContent);

      expect(metrics.complexity).toBeGreaterThan(1);
    });
  });

  describe('Directory Analysis', () => {
    it('should analyze directory structure', async () => {
      const dirPath = 'src';

      const report = await analyzer.analyzeDirectory(dirPath);

      expect(report).toHaveProperty('totalFiles');
      expect(report).toHaveProperty('totalLinesOfCode');
      expect(report).toHaveProperty('fileMetrics');
    });

    it('should aggregate metrics across files', async () => {
      const report = await analyzer.analyzeDirectory('src');

      expect(report.totalFiles).toBeGreaterThan(0);
      expect(report.totalLinesOfCode).toBeGreaterThan(0);
    });

    it('should filter files by extension', async () => {
      const report = await analyzer.analyzeDirectory('src', {
        includeExtensions: ['.ts'],
      });

      expect(report.fileMetrics.every((m: FileMetrics) => m.path.endsWith('.ts'))).toBe(true);
    });

    it('should exclude test files when configured', async () => {
      const report = await analyzer.analyzeDirectory('src', {
        excludePatterns: ['*.test.ts'],
      });

      expect(report.fileMetrics.every((m: FileMetrics) => !m.path.includes('.test.'))).toBe(true);
    });
  });

  describe('Code Smell Detection', () => {
    it('should detect long functions', async () => {
      const longFunction = `
        export function veryLongFunction() {
          ${Array(100).fill('console.log("line");').join('\n')}
        }
      `;

      const metrics = await analyzer.analyzeFile('test.ts', longFunction);

      expect(metrics.codeSmells).toBeDefined();
      const longFunctionSmell = metrics.codeSmells?.find((s: CodeSmell) => s.type === 'long-function');
      expect(longFunctionSmell).toBeDefined();
    });

    it('should detect high complexity', async () => {
      const complexCode = `
        export function complex(x: number) {
          if (x > 0) {
            if (x > 10) {
              if (x > 20) {
                if (x > 30) {
                  if (x > 40) {
                    if (x > 50) {
                      if (x > 60) {
                        if (x > 70) {
                          if (x > 80) {
                            if (x > 90) {
                              return 1;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          return 0;
        }
      `;

      const metrics = await analyzer.analyzeFile('test.ts', complexCode);

      const complexitySmell = metrics.codeSmells?.find((s: CodeSmell) => s.type === 'high-complexity');
      expect(complexitySmell).toBeDefined();
    });

    it('should detect duplicate code patterns', async () => {
      const duplicateCode = `
        function processA() {
          console.log('start');
          const result = doWork();
          console.log('processing');
          console.log('still processing');
          console.log('almost done');
          console.log('end');
          return result;
        }
        
        function processB() {
          console.log('start');
          const result = doWork();
          console.log('processing');
          console.log('still processing');
          console.log('almost done');
          console.log('end');
          return result;
        }
      `;

      const metrics = await analyzer.analyzeFile('test.ts', duplicateCode);

      const duplicationSmell = metrics.codeSmells?.find((s: CodeSmell) => s.type === 'duplication');
      expect(duplicationSmell).toBeDefined();
    });
  });

  describe('Dependency Analysis', () => {
    it('should extract imports from file', async () => {
      const fileContent = `
        import { Component } from './Component';
        import * as utils from './utils';
        import type { Config } from './types';
      `;

      const metrics = await analyzer.analyzeFile('test.ts', fileContent);

      expect(metrics.imports).toBeDefined();
      expect(metrics.imports!.length).toBeGreaterThan(0);
    });

    it('should distinguish between local and external imports', async () => {
      const fileContent = `
        import { useState } from 'react';
        import { helper } from './helper';
        import * as fs from 'fs';
      `;

      const metrics = await analyzer.analyzeFile('test.ts', fileContent);

      expect(metrics.imports).toBeDefined();
      const localImports = metrics.imports!.filter((i: string) => i.startsWith('.'));
      const externalImports = metrics.imports!.filter((i: string) => !i.startsWith('.'));

      expect(localImports.length).toBeGreaterThan(0);
      expect(externalImports.length).toBeGreaterThan(0);
    });
  });

  describe('Quality Metrics', () => {
    it('should calculate maintainability index', async () => {
      const fileContent = `
        export class SimpleClass {
          getValue(): number {
            return 42;
          }
        }
      `;

      const metrics = await analyzer.analyzeFile('test.ts', fileContent);

      expect(metrics).toHaveProperty('maintainabilityIndex');
      expect(metrics.maintainabilityIndex).toBeGreaterThanOrEqual(0);
      expect(metrics.maintainabilityIndex).toBeLessThanOrEqual(100);
    });

    it('should identify technical debt', async () => {
      const fileContent = `
        // TODO: Refactor this
        // FIXME: Bug here
        export function needsWork() {
          return 'temporary solution';
        }
      `;

      const metrics = await analyzer.analyzeFile('test.ts', fileContent);

      expect(metrics.technicalDebt).toBeDefined();
      expect(metrics.technicalDebt!.length).toBeGreaterThan(0);
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive analysis report', async () => {
      const report = await analyzer.generateReport('src');

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('issues');
      expect(report).toHaveProperty('recommendations');
    });

    it('should include high-level summary', async () => {
      const report = await analyzer.generateReport('src');

      expect(report.summary).toHaveProperty('totalFiles');
      expect(report.summary).toHaveProperty('totalLOC');
      expect(report.summary).toHaveProperty('averageComplexity');
    });

    it('should prioritize issues by severity', async () => {
      const report = await analyzer.generateReport('src');

      if (report.issues.length > 1) {
        // Critical issues should come first
        const firstIssue = report.issues[0];
        expect(['critical', 'high']).toContain(firstIssue.severity);
      }
    });

    it('should provide actionable recommendations', async () => {
      const report = await analyzer.generateReport('src');

      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle large files efficiently', async () => {
      const largeFile = Array(1000).fill('export const value = 42;').join('\n');

      const startTime = Date.now();
      await analyzer.analyzeFile('large.ts', largeFile);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should support incremental analysis', async () => {
      // First analysis
      await analyzer.analyzeFile('test.ts', 'export const a = 1;');

      // Second analysis should be faster (cached)
      const startTime = Date.now();
      await analyzer.analyzeFile('test.ts', 'export const a = 1;');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid file paths', async () => {
      await expect(analyzer.analyzeDirectory('/nonexistent/path')).rejects.toThrow();
    });

    it('should handle malformed code gracefully', async () => {
      const malformedCode = 'export class {{{{{ invalid syntax';

      // Should not throw, but may have limited metrics
      const metrics = await analyzer.analyzeFile('bad.ts', malformedCode);
      expect(metrics).toBeDefined();
    });

    it('should handle empty files', async () => {
      const metrics = await analyzer.analyzeFile('empty.ts', '');

      expect(metrics.linesOfCode).toBe(0);
      expect(metrics.complexity).toBe(0);
    });
  });
});
