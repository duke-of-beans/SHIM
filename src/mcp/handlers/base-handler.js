"use strict";
/**
 * Base Handler Interface
 *
 * All MCP tool handlers implement this interface.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseHandler = void 0;
/**
 * Base Handler
 *
 * Provides common functionality for all handlers
 */
class BaseHandler {
    /**
     * Log to stderr (not visible in Claude)
     */
    log(message, ...args) {
        console.error(`[SHIM MCP] ${message}`, ...args);
    }
    /**
     * Handle errors consistently
     */
    handleError(error, context) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.log(`Error in ${context}:`, errorMessage);
        return {
            success: false,
            error: errorMessage,
            context,
        };
    }
}
exports.BaseHandler = BaseHandler;
//# sourceMappingURL=base-handler.js.map