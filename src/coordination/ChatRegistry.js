/**
 * ChatRegistry
 *
 * Track and manage multiple chat instances for distributed coordination.
 * Part of Phase 4: Multi-Chat Coordination
 */
export class ChatRegistry {
    chats;
    idCounter;
    constructor() {
        this.chats = new Map();
        this.idCounter = 0;
    }
    registerChat(request) {
        const id = this.generateId();
        const chat = {
            id,
            name: request.name,
            capabilities: request.capabilities,
            status: 'idle',
            registeredAt: new Date(),
        };
        this.chats.set(id, chat);
        return id;
    }
    getChat(id) {
        return this.chats.get(id) || null;
    }
    listChats() {
        return Array.from(this.chats.values());
    }
    updateStatus(id, status) {
        const chat = this.chats.get(id);
        if (chat) {
            chat.status = status;
        }
    }
    findByStatus(status) {
        return this.listChats().filter((c) => c.status === status);
    }
    findByCapability(capability) {
        return this.listChats().filter((c) => c.capabilities.includes(capability));
    }
    assignTask(id, taskId) {
        const chat = this.chats.get(id);
        if (chat) {
            chat.currentTask = taskId;
            chat.status = 'busy';
        }
    }
    completeTask(id) {
        const chat = this.chats.get(id);
        if (chat) {
            chat.currentTask = undefined;
            chat.status = 'idle';
        }
    }
    unregisterChat(id) {
        this.chats.delete(id);
    }
    heartbeat(id) {
        const chat = this.chats.get(id);
        if (chat) {
            chat.lastHeartbeat = new Date();
        }
    }
    findStaleChats(thresholdMs) {
        const now = Date.now();
        return this.listChats().filter((c) => {
            if (!c.lastHeartbeat)
                return true;
            return now - c.lastHeartbeat.getTime() > thresholdMs;
        });
    }
    getStatistics() {
        const chats = this.listChats();
        const byStatus = {
            idle: 0,
            busy: 0,
            error: 0,
            offline: 0,
        };
        chats.forEach((chat) => {
            byStatus[chat.status]++;
        });
        return {
            total: chats.length,
            byStatus,
        };
    }
    generateId() {
        return `chat-${++this.idCounter}`;
    }
}
//# sourceMappingURL=ChatRegistry.js.map