"use strict";
/**
 * Code Analysis Handler
 *
 * Analyzes code quality in a directory.
 * Returns top improvement opportunities ranked by severity.
 *
 * Uses CodeAnalyzer from evolution package.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalysisHandler = void 0;
const base_handler_js_1 = require("./base-handler.js");
const CodeAnalyzer_js_1 = require("../../evolution/CodeAnalyzer.js");
const fs_1 = __importDefault(require("fs"));
class CodeAnalysisHandler extends base_handler_js_1.BaseHandler {
    analyzer;
    constructor() {
        super();
        // Initialize code analyzer with default config
        this.analyzer = new CodeAnalyzer_js_1.CodeAnalyzer({
            maxComplexity: 10,
            minCoverage: 80,
            maxFunctionLength: 50
        });
        this.log('Code Analysis Handler initialized');
    }
    async execute(args) {
        try {
            const startTime = Date.now();
            // Validate directory
            if (!args.directory) {
                throw new Error('Directory parameter required');
            }
            if (!fs_1.default.existsSync(args.directory)) {
                throw new Error(`Directory not found: ${args.directory}`);
            }
            const maxIssues = args.max_issues || 10;
            // Analyze codebase using CodeAnalyzer.generateReport()
            this.log('Starting code analysis', { directory: args.directory });
            const report = await this.analyzer.generateReport(args.directory);
            const elapsed = Date.now() - startTime;
            this.log('Code analysis complete', {
                filesAnalyzed: report.summary.totalFiles,
                issuesFound: report.issues.length,
                elapsed: `${elapsed}ms`,
            });
            // Issues are already sorted by severity in generateReport()
            const topIssues = report.issues.slice(0, maxIssues);
            // Return analysis results
            return {
                success: true,
                directory: args.directory,
                summary: {
                    total_files: report.summary.totalFiles,
                    total_loc: report.summary.totalLOC,
                    avg_complexity: report.summary.averageComplexity,
                    maintainability_score: report.summary.maintainabilityScore,
                },
                issues: topIssues.map(issue => ({
                    severity: issue.severity,
                    type: issue.type,
                    file: issue.file,
                    description: issue.description,
                })),
                recommendations: report.recommendations,
                elapsed_ms: elapsed,
            };
        }
        catch (error) {
            return this.handleError(error, 'code-analysis');
        }
    }
}
exports.CodeAnalysisHandler = CodeAnalysisHandler;
//# sourceMappingURL=code-analysis.js.map