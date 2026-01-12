/**
 * Base Handler Interface
 * 
 * All MCP tool handlers implement this interface.
 */

export interface HandlerResult {
  success: boolean;
  [key: string]: any;
}

export interface IHandler {
  /**
   * Execute the handler with given arguments
   */
  execute(args: any): Promise<HandlerResult>;
}

/**
 * Base Handler
 * 
 * Provides common functionality for all handlers
 */
export abstract class BaseHandler implements IHandler {
  abstract execute(args: any): Promise<HandlerResult>;

  /**
   * Log to stderr (not visible in Claude)
   */
  protected log(message: string, ...args: any[]): void {
    console.error(`[SHIM MCP] ${message}`, ...args);
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: unknown, context: string): HandlerResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.log(`Error in ${context}:`, errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      context,
    };
  }
}
