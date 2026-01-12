/**
 * Session Context Model
 *
 * Represents the current state of a session for checkpointing.
 * This is a simplified version of the full Checkpoint model,
 * used for creating checkpoints via the MCP API.
 */
export interface SessionContext {
    sessionId: string;
    currentTask: string;
    progress: number;
    decisions: string[];
    nextSteps: string[];
    activeFiles: string[];
    timestamp: string;
    metadata?: {
        checkpointType?: 'auto' | 'manual' | 'forced';
        reason?: string;
        [key: string]: any;
    };
}
//# sourceMappingURL=SessionContext.d.ts.map