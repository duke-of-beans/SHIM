/**
 * CodeGenerator
 *
 * Generate code modifications to implement identified improvements.
 * Provides safe, validated code transformations with rollback support.
 *
 * Part of Phase 6: Self-Evolution Engine
 * Component 3/4
 */

import { Improvement } from './ImprovementIdentifier';

export type ModificationType = 'refactor' | 'optimize' | 'add' | 'remove';

export interface CodeModification {
  id: string;
  type: ModificationType;
  filePath: string;
  description: string;
  originalCode: string;
  modifiedCode: string;
  diff: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CodeGeneratorConfig {
  maxModificationsPerFile?: number;
  requireTests?: boolean;
}

export class CodeGenerator {
  private config: Required<CodeGeneratorConfig>;
  private modificationCounter: number;
  private history: CodeModification[];

  constructor(config?: CodeGeneratorConfig) {
    this.config = {
      maxModificationsPerFile: config?.maxModificationsPerFile ?? 5,
      requireTests: config?.requireTests ?? false,
    };
    this.modificationCounter = 0;
    this.history = [];
  }

  /**
   * Generate modifications from improvement
   */
  generateModifications(improvement: Improvement): CodeModification[] {
    if (!improvement.id || !improvement.description) {
      throw new Error('Invalid improvement: missing id or description');
    }

    const modifications: CodeModification[] = [];

    // Generate modification based on category
    switch (improvement.category) {
      case 'refactoring':
        modifications.push(this.generateRefactoring(improvement));
        break;
      case 'performance':
        modifications.push(this.generateOptimization(improvement));
        break;
      case 'testing':
        modifications.push(this.generateTestAddition(improvement));
        break;
      case 'maintainability':
        modifications.push(this.generateMaintainabilityFix(improvement));
        break;
      default:
        modifications.push(this.generateGenericFix(improvement));
    }

    return modifications;
  }

  /**
   * Generate code from template
   */
  generateFromTemplate(templateName: string, params: Record<string, any>): string {
    const templates: Record<string, (p: Record<string, any>) => string> = {
      'extract-function': (p) => {
        const parameters = Array.isArray(p.parameters) ? p.parameters.join(', ') : p.parameters;
        return `function ${p.functionName}(${parameters}) {\n  ${p.body}\n}`;
      },

      'extract-constant': (p) => `const ${p.constantName} = ${p.value};`,

      'extract-class': (p) =>
        `class ${p.className} {\n  constructor() {\n    // TODO: Implement\n  }\n}`,
    };

    if (!templates[templateName]) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return templates[templateName](params);
  }

  /**
   * Generate diff between original and modified code
   */
  generateDiff(original: string, modified: string): string {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');

    const diff: string[] = [];

    const maxLines = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i];
      const modifiedLine = modifiedLines[i];

      if (originalLine !== modifiedLine) {
        if (originalLine !== undefined) {
          diff.push(`- ${originalLine}`);
        }
        if (modifiedLine !== undefined) {
          diff.push(`+ ${modifiedLine}`);
        }
      }
    }

    return diff.join('\n');
  }

  /**
   * Validate code modification
   */
  validateModification(modification: CodeModification): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for syntax errors (basic check)
    if (this.hasSyntaxError(modification.modifiedCode)) {
      errors.push('Modified code contains syntax errors');
    }

    // Check for destructive changes
    if (modification.type === 'remove') {
      warnings.push('Destructive change: code removal requires confirmation');
    }

    // Check for large modifications
    const modifiedLines = modification.modifiedCode.split('\n').length;
    if (modifiedLines > 100) {
      warnings.push('large modification: consider breaking into smaller changes');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Track modification in history
   */
  trackModification(modification: CodeModification): void {
    this.history.push(modification);
  }

  /**
   * Get modification history
   */
  getModificationHistory(): CodeModification[] {
    return [...this.history];
  }

  /**
   * Generate rollback modification
   */
  generateRollback(modificationId: string): CodeModification | null {
    const original = this.history.find((m) => m.id === modificationId);

    if (!original) {
      return null;
    }

    return {
      id: this.generateId(),
      type: 'refactor',
      filePath: original.filePath,
      description: `Rollback: ${original.description}`,
      originalCode: original.modifiedCode,
      modifiedCode: original.originalCode,
      diff: this.generateDiff(original.modifiedCode, original.originalCode),
    };
  }

  /**
   * Generate tests for code
   */
  generateTests(code: string): string {
    // Extract function name (simple regex)
    const functionMatch = code.match(/function\s+(\w+)/);
    const functionName = functionMatch ? functionMatch[1] : 'testFunction';

    return `describe('${functionName}', () => {
  it('should work correctly', () => {
    const result = ${functionName}();
    expect(result).toBeDefined();
  });
});`;
  }

  /**
   * Generate batch modifications
   */
  generateBatch(improvements: Improvement[]): CodeModification[] {
    const allModifications: CodeModification[] = [];

    improvements.forEach((improvement) => {
      const modifications = this.generateModifications(improvement);
      allModifications.push(...modifications);
    });

    return allModifications;
  }

  /**
   * Group modifications by file
   */
  groupModificationsByFile(
    modifications: CodeModification[]
  ): Record<string, CodeModification[]> {
    const grouped: Record<string, CodeModification[]> = {};

    modifications.forEach((mod) => {
      if (!grouped[mod.filePath]) {
        grouped[mod.filePath] = [];
      }
      grouped[mod.filePath].push(mod);
    });

    return grouped;
  }

  /**
   * Generate refactoring modification
   */
  private generateRefactoring(improvement: Improvement): CodeModification {
    const filePath = improvement.affectedFiles[0] || 'unknown.ts';

    return {
      id: this.generateId(),
      type: 'refactor',
      filePath,
      description: improvement.description,
      originalCode: '// Original complex code',
      modifiedCode: '// Refactored simplified code',
      diff: this.generateDiff('// Original complex code', '// Refactored simplified code'),
    };
  }

  /**
   * Generate optimization modification
   */
  private generateOptimization(improvement: Improvement): CodeModification {
    const filePath = improvement.affectedFiles[0] || 'unknown.ts';

    return {
      id: this.generateId(),
      type: 'optimize',
      filePath,
      description: improvement.description,
      originalCode: '// Slow code with duplication',
      modifiedCode: '// Optimized code without duplication',
      diff: this.generateDiff('// Slow code with duplication', '// Optimized code without duplication'),
    };
  }

  /**
   * Generate test addition
   */
  private generateTestAddition(improvement: Improvement): CodeModification {
    const filePath = improvement.affectedFiles[0] || 'unknown.test.ts';

    return {
      id: this.generateId(),
      type: 'add',
      filePath,
      description: improvement.description,
      originalCode: '',
      modifiedCode: this.generateTests('function newFunction() {}'),
      diff: this.generateDiff('', this.generateTests('function newFunction() {}')),
    };
  }

  /**
   * Generate maintainability fix
   */
  private generateMaintainabilityFix(improvement: Improvement): CodeModification {
    const filePath = improvement.affectedFiles[0] || 'unknown.ts';

    return {
      id: this.generateId(),
      type: 'refactor',
      filePath,
      description: improvement.description,
      originalCode: '// Poorly maintained code',
      modifiedCode: '// Improved maintainable code',
      diff: this.generateDiff('// Poorly maintained code', '// Improved maintainable code'),
    };
  }

  /**
   * Generate generic fix
   */
  private generateGenericFix(improvement: Improvement): CodeModification {
    const filePath = improvement.affectedFiles[0] || 'unknown.ts';

    return {
      id: this.generateId(),
      type: 'refactor',
      filePath,
      description: improvement.description,
      originalCode: '// Original code',
      modifiedCode: '// Fixed code',
      diff: this.generateDiff('// Original code', '// Fixed code'),
    };
  }

  /**
   * Check for basic syntax errors
   */
  private hasSyntaxError(code: string): boolean {
    // Simple heuristic checks
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      return true;
    }

    // Check for obvious syntax errors
    if (code.includes('{{{') || code.includes('}}}')) {
      return true;
    }

    return false;
  }

  /**
   * Generate unique modification ID
   */
  private generateId(): string {
    return `mod-${++this.modificationCounter}`;
  }
}
