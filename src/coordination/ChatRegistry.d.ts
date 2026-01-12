/**
 * ChatRegistry
 *
 * Track and manage multiple chat instances for distributed coordination.
 * Part of Phase 4: Multi-Chat Coordination
 */
export type ChatStatus = 'idle' | 'busy' | 'error' | 'offline';
export interface ChatInstance {
    id: string;
    name: string;
    capabilities: string[];
    status: ChatStatus;
    currentTask?: string;
    lastHeartbeat?: Date;
    registeredAt: Date;
}
export interface ChatRegistrationRequest {
    name: string;
    capabilities: string[];
}
export interface RegistryStatistics {
    total: number;
    byStatus: Record<ChatStatus, number>;
}
export declare class ChatRegistry {
    private chats;
    private idCounter;
    constructor();
    registerChat(request: ChatRegistrationRequest): string;
    getChat(id: string): ChatInstance | null;
    listChats(): ChatInstance[];
    updateStatus(id: string, status: ChatStatus): void;
    findByStatus(status: ChatStatus): ChatInstance[];
    findByCapability(capability: string): ChatInstance[];
    assignTask(id: string, taskId: string): void;
    completeTask(id: string): void;
    unregisterChat(id: string): void;
    heartbeat(id: string): void;
    findStaleChats(thresholdMs: number): ChatInstance[];
    getStatistics(): RegistryStatistics;
    private generateId;
}
//# sourceMappingURL=ChatRegistry.d.ts.map