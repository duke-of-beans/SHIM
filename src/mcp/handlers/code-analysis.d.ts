/**
 * Code Analysis Handler
 *
 * Analyzes code quality in a directory.
 * Returns top improvement opportunities ranked by severity.
 *
 * Uses CodeAnalyzer from evolution package.
 */
import { BaseHandler, HandlerResult } from './base-handler.js';
interface CodeAnalysisArgs {
    directory: string;
    max_issues?: number;
    include_extensions?: string[];
    exclude_patterns?: string[];
}
export declare class CodeAnalysisHandler extends BaseHandler {
    private analyzer;
    constructor();
    execute(args: CodeAnalysisArgs): Promise<HandlerResult>;
}
export {};
//# sourceMappingURL=code-analysis.d.ts.map