/**
 * WorkDistributor
 *
 * Distribute tasks across multiple chat instances intelligently.
 * Part of Phase 4: Multi-Chat Coordination
 */

import { ChatRegistry } from './ChatRegistry';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type DistributionStrategy = 'round-robin' | 'capability-match' | 'load-balance';

export interface Task {
  id: string;
  type: string;
  priority: TaskPriority;
  payload: any;
  requiredCapability?: string;
}

export interface TaskAssignment {
  taskId: string;
  chatId: string;
}

export interface DistributionStatistics {
  totalDistributed: number;
  queuedTasks: number;
}

export class WorkDistributor {
  private registry: ChatRegistry;
  private strategy: DistributionStrategy;
  private taskQueue: Task[];
  private distributionCount: number;

  constructor(registry: ChatRegistry, strategy: DistributionStrategy = 'load-balance') {
    this.registry = registry;
    this.strategy = strategy;
    this.taskQueue = [];
    this.distributionCount = 0;
  }

  distributeTask(task: Task): string | null {
    let targetChat = null;

    // Check for capability requirement
    if (task.requiredCapability) {
      const capableChats = this.registry.findByCapability(task.requiredCapability);
      const idleCapable = capableChats.filter((c) => c.status === 'idle');

      if (idleCapable.length > 0) {
        targetChat = idleCapable[0].id;
      }
    } else {
      // Find any idle chat
      const idleChats = this.registry.findByStatus('idle');
      if (idleChats.length > 0) {
        targetChat = idleChats[0].id;
      }
    }

    if (targetChat) {
      this.registry.assignTask(targetChat, task.id);
      this.distributionCount++;
      return targetChat;
    }

    return null;
  }

  queueTask(task: Task): void {
    this.taskQueue.push(task);
    this.sortQueue();
  }

  getNextTask(): Task | null {
    return this.taskQueue.shift() || null;
  }

  getQueuedTasks(): Task[] {
    return [...this.taskQueue];
  }

  processQueue(): TaskAssignment[] {
    const assignments: TaskAssignment[] = [];

    while (this.taskQueue.length > 0) {
      const task = this.taskQueue[0];
      const chatId = this.distributeTask(task);

      if (!chatId) {
        break; // No available chats
      }

      this.taskQueue.shift();
      assignments.push({ taskId: task.id, chatId });
    }

    return assignments;
  }

  getStatistics(): DistributionStatistics {
    return {
      totalDistributed: this.distributionCount,
      queuedTasks: this.taskQueue.length,
    };
  }

  private sortQueue(): void {
    const priorityOrder: Record<TaskPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    this.taskQueue.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}
