/**
 * CodeAnalyzer
 *
 * Analyze codebase structure, metrics, and quality for self-improvement.
 * Provides insights into complexity, maintainability, and technical debt.
 *
 * Part of Phase 6: Self-Evolution Engine
 * Component 1/4
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CodeAnalyzerConfig {
  maxComplexity?: number;
  minCoverage?: number;
  maxFunctionLength?: number;
}

export interface CodeSmell {
  type: 'long-function' | 'high-complexity' | 'duplication' | 'todo' | 'fixme';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
}

export interface TechnicalDebt {
  type: 'TODO' | 'FIXME' | 'HACK' | 'XXX';
  line: number;
  description: string;
}

export interface FileMetrics {
  path: string;
  linesOfCode: number;
  complexity: number;
  maintainabilityIndex: number;
  imports?: string[];
  codeSmells?: CodeSmell[];
  technicalDebt?: TechnicalDebt[];
}

export interface DirectoryAnalysis {
  totalFiles: number;
  totalLinesOfCode: number;
  averageComplexity: number;
  fileMetrics: FileMetrics[];
}

export interface AnalysisReport {
  summary: {
    totalFiles: number;
    totalLOC: number;
    averageComplexity: number;
    maintainabilityScore: number;
  };
  metrics: FileMetrics[];
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    file: string;
    description: string;
  }>;
  recommendations: string[];
}

export class CodeAnalyzer {
  private config: Required<CodeAnalyzerConfig>;
  private cache: Map<string, FileMetrics>;

  constructor(config?: CodeAnalyzerConfig) {
    this.config = {
      maxComplexity: config?.maxComplexity ?? 10,
      minCoverage: config?.minCoverage ?? 80,
      maxFunctionLength: config?.maxFunctionLength ?? 50,
    };
    this.cache = new Map();
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(filePath: string, fileContent: string): Promise<FileMetrics> {
    // Check cache
    const cacheKey = `${filePath}:${fileContent}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const linesOfCode = this.countLOC(fileContent);
    const complexity = this.calculateComplexity(fileContent);
    const maintainabilityIndex = this.calculateMaintainability(linesOfCode, complexity);
    const imports = this.extractImports(fileContent);
    const codeSmells = this.detectCodeSmells(fileContent, linesOfCode, complexity);
    const technicalDebt = this.findTechnicalDebt(fileContent);

    const metrics: FileMetrics = {
      path: filePath,
      linesOfCode,
      complexity,
      maintainabilityIndex,
      imports,
      codeSmells,
      technicalDebt,
    };

    this.cache.set(cacheKey, metrics);
    return metrics;
  }

  /**
   * Analyze a directory
   */
  async analyzeDirectory(
    dirPath: string,
    options?: {
      includeExtensions?: string[];
      excludePatterns?: string[];
    }
  ): Promise<DirectoryAnalysis> {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    const files = await this.findFiles(dirPath, options);
    const fileMetrics: FileMetrics[] = [];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const metrics = await this.analyzeFile(filePath, content);
      fileMetrics.push(metrics);
    }

    const totalLinesOfCode = fileMetrics.reduce((sum, m) => sum + m.linesOfCode, 0);
    const averageComplexity =
      fileMetrics.reduce((sum, m) => sum + m.complexity, 0) / (fileMetrics.length || 1);

    return {
      totalFiles: fileMetrics.length,
      totalLinesOfCode,
      averageComplexity,
      fileMetrics,
    };
  }

  /**
   * Generate comprehensive analysis report
   */
  async generateReport(dirPath: string): Promise<AnalysisReport> {
    const analysis = await this.analyzeDirectory(dirPath, {
      includeExtensions: ['.ts'],
      excludePatterns: ['*.test.ts', '*.spec.ts'],
    });

    // Collect all issues
    const issues: AnalysisReport['issues'] = [];
    analysis.fileMetrics.forEach((metrics) => {
      metrics.codeSmells?.forEach((smell) => {
        issues.push({
          severity: smell.severity,
          type: smell.type,
          file: metrics.path,
          description: smell.description,
        });
      });
    });

    // Sort by severity
    issues.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(analysis, issues);

    // Calculate overall maintainability
    const maintainabilityScore =
      analysis.fileMetrics.reduce((sum, m) => sum + m.maintainabilityIndex, 0) /
      (analysis.fileMetrics.length || 1);

    return {
      summary: {
        totalFiles: analysis.totalFiles,
        totalLOC: analysis.totalLinesOfCode,
        averageComplexity: analysis.averageComplexity,
        maintainabilityScore,
      },
      metrics: analysis.fileMetrics,
      issues,
      recommendations,
    };
  }

  /**
   * Count lines of code (excluding comments and blank lines)
   */
  private countLOC(content: string): number {
    const lines = content.split('\n');
    let loc = 0;
    let inMultiLineComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Toggle multi-line comment state
      if (trimmed.includes('/*')) inMultiLineComment = true;
      if (trimmed.includes('*/')) {
        inMultiLineComment = false;
        continue;
      }

      // Skip if in multi-line comment, blank, or single-line comment
      if (inMultiLineComment || !trimmed || trimmed.startsWith('//')) {
        continue;
      }

      loc++;
    }

    return loc;
  }

  /**
   * Calculate cyclomatic complexity
   */
  private calculateComplexity(content: string): number {
    // Empty content has 0 complexity
    if (!content || content.trim().length === 0) {
      return 0;
    }

    let complexity = 1; // Base complexity

    // Count decision points
    const patterns = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\&\&/g,
      /\|\|/g,
      /\?/g, // Ternary operator
    ];

    patterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  /**
   * Calculate maintainability index (0-100, higher is better)
   */
  private calculateMaintainability(loc: number, complexity: number): number {
    // Simplified maintainability index
    // Based on lines of code and complexity
    const volumeFactor = Math.max(0, 100 - Math.log(loc + 1) * 10);
    const complexityFactor = Math.max(0, 100 - complexity * 5);

    return Math.round((volumeFactor + complexityFactor) / 2);
  }

  /**
   * Extract import statements
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+(?:.*?from\s+)?['"]([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Detect code smells
   */
  private detectCodeSmells(content: string, loc: number, complexity: number): CodeSmell[] {
    const smells: CodeSmell[] = [];

    // Long function
    if (loc > this.config.maxFunctionLength) {
      smells.push({
        type: 'long-function',
        severity: 'medium',
        location: 'file',
        description: `File has ${loc} lines, exceeds maximum of ${this.config.maxFunctionLength}`,
      });
    }

    // High complexity
    if (complexity > this.config.maxComplexity) {
      smells.push({
        type: 'high-complexity',
        severity: 'high',
        location: 'file',
        description: `Complexity ${complexity} exceeds maximum of ${this.config.maxComplexity}`,
      });
    }

    // Code duplication (detect repeated lines)
    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 5 && !l.startsWith('//') && !l.startsWith('/*'));

    // Count line frequencies
    const lineCounts = new Map<string, number>();
    lines.forEach((line) => {
      lineCounts.set(line, (lineCounts.get(line) || 0) + 1);
    });

    // Check for duplicated lines
    const duplicatedLines = Array.from(lineCounts.values()).filter((count) => count > 1);
    if (duplicatedLines.length > 0 && lines.length > 10) {
      smells.push({
        type: 'duplication',
        severity: 'medium',
        location: 'file',
        description: 'Potential code duplication detected',
      });
    }

    return smells;
  }

  /**
   * Find technical debt markers
   */
  private findTechnicalDebt(content: string): TechnicalDebt[] {
    const debt: TechnicalDebt[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.includes('TODO:') || trimmed.includes('TODO ')) {
        debt.push({
          type: 'TODO',
          line: index + 1,
          description: trimmed,
        });
      }

      if (trimmed.includes('FIXME:') || trimmed.includes('FIXME ')) {
        debt.push({
          type: 'FIXME',
          line: index + 1,
          description: trimmed,
        });
      }

      if (trimmed.includes('HACK:') || trimmed.includes('HACK ')) {
        debt.push({
          type: 'HACK',
          line: index + 1,
          description: trimmed,
        });
      }
    });

    return debt;
  }

  /**
   * Find files in directory
   */
  private async findFiles(
    dirPath: string,
    options?: {
      includeExtensions?: string[];
      excludePatterns?: string[];
    }
  ): Promise<string[]> {
    const files: string[] = [];

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile()) {
          // Check extensions
          if (options?.includeExtensions) {
            const hasMatchingExt = options.includeExtensions.some((ext) => fullPath.endsWith(ext));
            if (!hasMatchingExt) continue;
          }

          // Check exclude patterns
          if (options?.excludePatterns) {
            const isExcluded = options.excludePatterns.some((pattern) => {
              const regex = new RegExp(pattern.replace('*', '.*'));
              return regex.test(fullPath);
            });
            if (isExcluded) continue;
          }

          files.push(fullPath);
        }
      }
    };

    walk(dirPath);
    return files;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    analysis: DirectoryAnalysis,
    issues: AnalysisReport['issues']
  ): string[] {
    const recommendations: string[] = [];

    // High complexity
    const complexityIssues = issues.filter((i) => i.type === 'high-complexity');
    if (complexityIssues.length > 0) {
      recommendations.push('Refactor complex functions to improve maintainability');
    }

    // Long functions
    const longFunctions = issues.filter((i) => i.type === 'long-function');
    if (longFunctions.length > 0) {
      recommendations.push('Break down long functions into smaller, focused units');
    }

    // Code duplication
    const duplication = issues.filter((i) => i.type === 'duplication');
    if (duplication.length > 0) {
      recommendations.push('Extract duplicated code into reusable functions');
    }

    // High average complexity
    if (analysis.averageComplexity > this.config.maxComplexity) {
      recommendations.push('Overall code complexity is high - consider architectural simplification');
    }

    return recommendations;
  }
}
