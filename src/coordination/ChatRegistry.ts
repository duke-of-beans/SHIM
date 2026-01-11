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

export class ChatRegistry {
  private chats: Map<string, ChatInstance>;
  private idCounter: number;

  constructor() {
    this.chats = new Map();
    this.idCounter = 0;
  }

  registerChat(request: ChatRegistrationRequest): string {
    const id = this.generateId();
    const chat: ChatInstance = {
      id,
      name: request.name,
      capabilities: request.capabilities,
      status: 'idle',
      registeredAt: new Date(),
    };

    this.chats.set(id, chat);
    return id;
  }

  getChat(id: string): ChatInstance | null {
    return this.chats.get(id) || null;
  }

  listChats(): ChatInstance[] {
    return Array.from(this.chats.values());
  }

  updateStatus(id: string, status: ChatStatus): void {
    const chat = this.chats.get(id);
    if (chat) {
      chat.status = status;
    }
  }

  findByStatus(status: ChatStatus): ChatInstance[] {
    return this.listChats().filter((c) => c.status === status);
  }

  findByCapability(capability: string): ChatInstance[] {
    return this.listChats().filter((c) => c.capabilities.includes(capability));
  }

  assignTask(id: string, taskId: string): void {
    const chat = this.chats.get(id);
    if (chat) {
      chat.currentTask = taskId;
      chat.status = 'busy';
    }
  }

  completeTask(id: string): void {
    const chat = this.chats.get(id);
    if (chat) {
      chat.currentTask = undefined;
      chat.status = 'idle';
    }
  }

  unregisterChat(id: string): void {
    this.chats.delete(id);
  }

  heartbeat(id: string): void {
    const chat = this.chats.get(id);
    if (chat) {
      chat.lastHeartbeat = new Date();
    }
  }

  findStaleChats(thresholdMs: number): ChatInstance[] {
    const now = Date.now();
    return this.listChats().filter((c) => {
      if (!c.lastHeartbeat) return true;
      return now - c.lastHeartbeat.getTime() > thresholdMs;
    });
  }

  getStatistics(): RegistryStatistics {
    const chats = this.listChats();
    const byStatus: Record<ChatStatus, number> = {
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

  private generateId(): string {
    return `chat-${++this.idCounter}`;
  }
}
