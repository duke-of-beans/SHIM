/**
 * CodeGenerator Tests
 *
 * Tests for autonomous code modification generation.
 * Following TDD: Test file created FIRST, implementation SECOND.
 *
 * Purpose: Generate safe, validated code modifications for improvements.
 */

import { CodeGenerator, CodeModification, ModificationType, ValidationResult } from './CodeGenerator';
import { Improvement } from './ImprovementIdentifier';

describe('CodeGenerator', () => {
  let generator: CodeGenerator;

  beforeEach(() => {
    generator = new CodeGenerator();
  });

  describe('Construction', () => {
    it('should create CodeGenerator instance', () => {
      expect(generator).toBeInstanceOf(CodeGenerator);
    });

    it('should accept custom configuration', () => {
      const customGenerator = new CodeGenerator({
        maxModificationsPerFile: 10,
        requireTests: true,
      });

      expect(customGenerator).toBeInstanceOf(CodeGenerator);
    });
  });

  describe('Modification Generation', () => {
    it('should generate modification from improvement', () => {
      const improvement: Improvement = {
        id: '1',
        category: 'refactoring',
        priority: 'high',
        impact: 8,
        effort: 5,
        description: 'Extract duplicate code',
        affectedFiles: ['src/test.ts'],
      };

      const modifications = generator.generateModifications(improvement);

      expect(modifications).toBeDefined();
      expect(Array.isArray(modifications)).toBe(true);
      expect(modifications.length).toBeGreaterThan(0);
    });

    it('should generate refactoring modifications', () => {
      const improvement: Improvement = {
        id: '1',
        category: 'refactoring',
        priority: 'high',
        impact: 8,
        effort: 5,
        description: 'Reduce complexity in complex.ts',
        affectedFiles: ['src/complex.ts'],
      };

      const modifications = generator.generateModifications(improvement);

      expect(modifications.some((m: CodeModification) => m.type === 'refactor')).toBe(true);
    });

    it('should generate performance modifications', () => {
      const improvement: Improvement = {
        id: '1',
        category: 'performance',
        priority: 'high',
        impact: 7,
        effort: 4,
        description: 'Extract duplicated code',
        affectedFiles: ['src/slow.ts'],
      };

      const modifications = generator.generateModifications(improvement);

      expect(modifications.some((m: CodeModification) => m.type === 'optimize')).toBe(true);
    });
  });

  describe('Modification Types', () => {
    it('should support refactor type', () => {
      const improvement: Improvement = {
        id: '1',
        category: 'refactoring',
        priority: 'high',
        impact: 8,
        effort: 5,
        description: 'Refactor complex function',
        affectedFiles: ['test.ts'],
      };

      const modifications = generator.generateModifications(improvement);

      expect(modifications.every((m: CodeModification) => ['refactor', 'optimize', 'add', 'remove'].includes(m.type))).toBe(true);
    });

    it('should support optimize type', () => {
      const improvement: Improvement = {
        id: '1',
        category: 'performance',
        priority: 'medium',
        impact: 6,
        effort: 3,
        description: 'Optimize performance',
        affectedFiles: ['test.ts'],
      };

      const modifications = generator.generateModifications(improvement);

      expect(modifications.some((m: CodeModification) => m.type === 'optimize')).toBe(true);
    });

    it('should support add type for new code', () => {
      const improvement: Improvement = {
        id: '1',
        category: 'testing',
        priority: 'medium',
        impact: 5,
        effort: 3,
        description: 'Add missing tests',
        affectedFiles: ['test.ts'],
      };

      const modifications = generator.generateModifications(improvement);

      expect(modifications.some((m: CodeModification) => m.type === 'add')).toBe(true);
    });
  });

  describe('Code Templates', () => {
    it('should use templates for common patterns', () => {
      const modification = generator.generateFromTemplate('extract-function', {
        functionName: 'processData',
        parameters: ['data'],
        body: 'return data.map(x => x * 2);',
      });

      expect(modification).toContain('function processData');
      expect(modification).toContain('data');
    });

    it('should support extract function template', () => {
      const code = generator.generateFromTemplate('extract-function', {
        functionName: 'calculate',
        parameters: ['x', 'y'],
        body: 'return x + y;',
      });

      expect(code).toContain('function calculate(x, y)');
      expect(code).toContain('return x + y;');
    });

    it('should support extract constant template', () => {
      const code = generator.generateFromTemplate('extract-constant', {
        constantName: 'MAX_VALUE',
        value: '100',
      });

      expect(code).toContain('const MAX_VALUE');
      expect(code).toContain('100');
    });
  });

  describe('Diff Generation', () => {
    it('should generate diff for modifications', () => {
      const original = `function test() {
  console.log('hello');
}`;

      const modified = `function test() {
  console.log('hello world');
}`;

      const diff = generator.generateDiff(original, modified);

      expect(diff).toBeDefined();
      expect(diff).toContain('-');
      expect(diff).toContain('+');
    });

    it('should show additions in diff', () => {
      const original = 'const a = 1;';
      const modified = 'const a = 1;\nconst b = 2;';

      const diff = generator.generateDiff(original, modified);

      expect(diff).toContain('+');
      expect(diff).toContain('const b = 2');
    });

    it('should show removals in diff', () => {
      const original = 'const a = 1;\nconst b = 2;';
      const modified = 'const a = 1;';

      const diff = generator.generateDiff(original, modified);

      expect(diff).toContain('-');
      expect(diff).toContain('const b = 2');
    });
  });

  describe('Validation', () => {
    it('should validate generated modifications', () => {
      const modification: CodeModification = {
        id: '1',
        type: 'refactor',
        filePath: 'test.ts',
        description: 'Extract function',
        originalCode: 'const x = 1;',
        modifiedCode: 'function getValue() { return 1; }',
        diff: '',
      };

      const result = generator.validateModification(modification);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });

    it('should detect syntax errors', () => {
      const modification: CodeModification = {
        id: '1',
        type: 'refactor',
        filePath: 'test.ts',
        description: 'Invalid code',
        originalCode: 'const x = 1;',
        modifiedCode: 'const x = {{{invalid',
        diff: '',
      };

      const result = generator.validateModification(modification);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate TypeScript syntax', () => {
      const modification: CodeModification = {
        id: '1',
        type: 'refactor',
        filePath: 'test.ts',
        description: 'Add type',
        originalCode: 'const x = 1;',
        modifiedCode: 'const x: number = 1;',
        diff: '',
      };

      const result = generator.validateModification(modification);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Safety Checks', () => {
    it('should prevent destructive changes without confirmation', () => {
      const modification: CodeModification = {
        id: '1',
        type: 'remove',
        filePath: 'critical.ts',
        description: 'Remove function',
        originalCode: 'function important() { }',
        modifiedCode: '',
        diff: '',
      };

      const result = generator.validateModification(modification);

      expect(result.warnings).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should flag large modifications', () => {
      const largeCode = Array(200).fill('const x = 1;').join('\n');

      const modification: CodeModification = {
        id: '1',
        type: 'refactor',
        filePath: 'test.ts',
        description: 'Large change',
        originalCode: 'const x = 1;',
        modifiedCode: largeCode,
        diff: '',
      };

      const result = generator.validateModification(modification);

      expect(result.warnings.some((w: string) => w.includes('large'))).toBe(true);
    });
  });

  describe('Rollback Support', () => {
    it('should track modification history', () => {
      const modification: CodeModification = {
        id: '1',
        type: 'refactor',
        filePath: 'test.ts',
        description: 'Change',
        originalCode: 'const x = 1;',
        modifiedCode: 'const x = 2;',
        diff: '',
      };

      generator.trackModification(modification);

      const history = generator.getModificationHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should support rollback to original code', () => {
      const modification: CodeModification = {
        id: '1',
        type: 'refactor',
        filePath: 'test.ts',
        description: 'Change',
        originalCode: 'const x = 1;',
        modifiedCode: 'const x = 2;',
        diff: '',
      };

      generator.trackModification(modification);

      const rollback = generator.generateRollback(modification.id);

      expect(rollback).toBeDefined();
      expect(rollback?.modifiedCode).toBe(modification.originalCode);
    });
  });

  describe('Test Generation', () => {
    it('should generate tests for new functions', () => {
      const code = 'function add(a: number, b: number): number { return a + b; }';

      const tests = generator.generateTests(code);

      expect(tests).toBeDefined();
      expect(tests).toContain('describe');
      expect(tests).toContain('it');
      expect(tests).toContain('expect');
    });

    it('should include basic test cases', () => {
      const code = 'function multiply(x: number, y: number): number { return x * y; }';

      const tests = generator.generateTests(code);

      expect(tests).toContain('multiply');
      expect(tests).toContain('expect');
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple improvements', () => {
      const improvements: Improvement[] = [
        {
          id: '1',
          category: 'refactoring',
          priority: 'high',
          impact: 8,
          effort: 5,
          description: 'Refactor A',
          affectedFiles: ['a.ts'],
        },
        {
          id: '2',
          category: 'performance',
          priority: 'medium',
          impact: 6,
          effort: 3,
          description: 'Optimize B',
          affectedFiles: ['b.ts'],
        },
      ];

      const modifications = generator.generateBatch(improvements);

      expect(modifications.length).toBeGreaterThan(0);
    });

    it('should aggregate modifications by file', () => {
      const improvements: Improvement[] = [
        {
          id: '1',
          category: 'refactoring',
          priority: 'high',
          impact: 8,
          effort: 5,
          description: 'Fix 1',
          affectedFiles: ['test.ts'],
        },
        {
          id: '2',
          category: 'refactoring',
          priority: 'medium',
          impact: 6,
          effort: 4,
          description: 'Fix 2',
          affectedFiles: ['test.ts'],
        },
      ];

      const byFile = generator.groupModificationsByFile(
        generator.generateBatch(improvements)
      );

      expect(byFile['test.ts']).toBeDefined();
      expect(byFile['test.ts'].length).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid improvement', () => {
      const invalid: Improvement = {
        id: '',
        category: 'refactoring',
        priority: 'high',
        impact: 8,
        effort: 5,
        description: '',
        affectedFiles: [],
      };

      expect(() => generator.generateModifications(invalid)).toThrow();
    });

    it('should handle template not found', () => {
      expect(() => generator.generateFromTemplate('nonexistent', {})).toThrow();
    });
  });
});
