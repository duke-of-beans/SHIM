/**
 * SessionBalancer Tests
 * 
 * Tests for intelligent load balancing across chat sessions.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * Purpose: Balance workload across multiple chat sessions based on:
 * - Current load (tasks assigned)
 * - Historical performance
 * - Resource constraints
 * - Task complexity
 * 
 * Ensures optimal resource utilization and prevents overloading.
 */

import { SessionBalancer, BalancerConfig, LoadMetrics } from './SessionBalancer';
import { ChatCoordinator } from './ChatCoordinator';
import { WorkerRegistry } from './WorkerRegistry';
import { MessageBusWrapper } from './MessageBusWrapper';
import { RedisConnectionManager } from './RedisConnectionManager';

describe('SessionBalancer', () => {
  let balancer: SessionBalancer;
  let coordinator: ChatCoordinator;
  let registry: WorkerRegistry;
  let messageBus: MessageBusWrapper;
  let redisManager: RedisConnectionManager;
  
  beforeEach(async () => {
    // Set up test Redis
    redisManager = new RedisConnectionManager({
      host: 'localhost',
      port: 6379,
      db: 1,
      keyPrefix: 'shim:test:',
      lazyConnect: true,
    });
    
    await redisManager.connect();
    
    // Clear test database
    const client = redisManager.getClient();
    await client.flushdb();
    
    // Initialize components
    registry = new WorkerRegistry(redisManager);
    messageBus = new MessageBusWrapper(redisManager);
    coordinator = new ChatCoordinator({
      registry,
      messageBus,
      maxConcurrentChats: 5
    });
    
    balancer = new SessionBalancer({
      coordinator,
      registry,
      maxTasksPerSession: 3,
      balancingInterval: 5000
    });
  });
  
  afterEach(async () => {
    await balancer.stop();
    await coordinator.stop();
    await messageBus.cleanup();
    await registry.cleanup();
    await redisManager.disconnect();
  });
  
  describe('Construction', () => {
    it('should create SessionBalancer instance', () => {
      expect(balancer).toBeInstanceOf(SessionBalancer);
    });
    
    it('should accept configuration', () => {
      const config = balancer.getConfig();
      
      expect(config.maxTasksPerSession).toBe(3);
      expect(config.balancingInterval).toBe(5000);
    });
    
    it('should validate configuration', () => {
      expect(() => {
        new SessionBalancer({
          coordinator,
          registry,
          maxTasksPerSession: 0  // Invalid
        });
      }).toThrow();
    });
  });
  
  describe('Load Calculation', () => {
    it('should calculate load for empty session', async () => {
      await coordinator.registerChat('chat-001');
      
      const load = await balancer.calculateLoad('chat-001');
      
      expect(load.currentTasks).toBe(0);
      expect(load.utilizationRate).toBe(0);
    });
    
    it('should calculate load for busy session', async () => {
      await coordinator.registerChat('chat-001');
      
      // Assign tasks
      await coordinator.assignTask({ id: 't1', type: 'review', priority: 1, data: {} });
      await coordinator.assignTask({ id: 't2', type: 'review', priority: 1, data: {} });
      
      const load = await balancer.calculateLoad('chat-001');
      
      expect(load.currentTasks).toBe(2);
      expect(load.utilizationRate).toBeGreaterThan(0);
    });
    
    it('should get load metrics for all sessions', async () => {
      await coordinator.registerChat('chat-001');
      await coordinator.registerChat('chat-002');
      
      const metrics = await balancer.getAllLoadMetrics();
      
      expect(metrics.length).toBe(2);
    });
  });
  
  describe('Load Balancing', () => {
    it('should select least loaded session', async () => {
      await coordinator.registerChat('chat-001');
      await coordinator.registerChat('chat-002');
      
      // Load chat-001
      await coordinator.assignTask({ id: 't1', type: 'review', priority: 1, data: {} });
      await coordinator.assignTask({ id: 't2', type: 'review', priority: 1, data: {} });
      
      const selected = await balancer.selectSession();
      
      // Should select chat-002 (less loaded)
      expect(selected).toBe('chat-002');
    });
    
    it('should avoid overloaded sessions', async () => {
      await coordinator.registerChat('chat-001');
      await coordinator.registerChat('chat-002');
      
      // Overload chat-001 (max 3 tasks)
      await coordinator.assignTask({ id: 't1', type: 'review', priority: 1, data: {} });
      await coordinator.assignTask({ id: 't2', type: 'review', priority: 1, data: {} });
      await coordinator.assignTask({ id: 't3', type: 'review', priority: 1, data: {} });
      
      const selected = await balancer.selectSession();
      
      // Must select chat-002
      expect(selected).toBe('chat-002');
    });
    
    it('should return null when all sessions overloaded', async () => {
      await coordinator.registerChat('chat-001');
      
      // Overload
      await coordinator.assignTask({ id: 't1', type: 'review', priority: 1, data: {} });
      await coordinator.assignTask({ id: 't2', type: 'review', priority: 1, data: {} });
      await coordinator.assignTask({ id: 't3', type: 'review', priority: 1, data: {} });
      
      const selected = await balancer.selectSession();
      
      expect(selected).toBeNull();
    });
  });
  
  describe('Rebalancing', () => {
    it('should detect imbalanced load', async () => {
      await coordinator.registerChat('chat-001');
      await coordinator.registerChat('chat-002');
      
      // Unbalanced load
      await coordinator.assignTask({ id: 't1', type: 'review', priority: 1, data: {} });
      await coordinator.assignTask({ id: 't2', type: 'review', priority: 1, data: {} });
      await coordinator.assignTask({ id: 't3', type: 'review', priority: 1, data: {} });
      
      const isBalanced = await balancer.isBalanced();
      
      expect(isBalanced).toBe(false);
    });
    
    it('should rebalance tasks across sessions', async () => {
      await coordinator.registerChat('chat-001');
      await coordinator.registerChat('chat-002');
      
      // Unbalanced load
      await coordinator.assignTask({ id: 't1', type: 'review', priority: 1, data: {} });
      await coordinator.assignTask({ id: 't2', type: 'review', priority: 1, data: {} });
      await coordinator.assignTask({ id: 't3', type: 'review', priority: 1, data: {} });
      
      await balancer.rebalance();
      
      // Load should now be more balanced
      const metrics = await balancer.getAllLoadMetrics();
      const loads = metrics.map(m => m.currentTasks);
      const maxDiff = Math.max(...loads) - Math.min(...loads);
      
      expect(maxDiff).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Historical Performance', () => {
    it('should track task completion times', async () => {
      await coordinator.registerChat('chat-001');
      
      await coordinator.assignTask({ id: 't1', type: 'review', priority: 1, data: {} });
      await coordinator.completeTask('t1', { success: true, result: {} });
      
      const perf = await balancer.getPerformanceMetrics('chat-001');
      
      expect(perf.averageCompletionTime).toBeGreaterThan(0);
    });
    
    it('should prefer faster sessions', async () => {
      await coordinator.registerChat('chat-001');
      await coordinator.registerChat('chat-002');
      
      // Record faster performance for chat-002
      await balancer.recordPerformance('chat-002', { completionTime: 100, success: true });
      await balancer.recordPerformance('chat-001', { completionTime: 500, success: true });
      
      const selected = await balancer.selectSessionByPerformance();
      
      expect(selected).toBe('chat-002');
    });
  });
  
  describe('Auto-Balancing', () => {
    it('should start auto-balancing', async () => {
      await balancer.startAutoBalancing();
      
      expect(balancer.isAutoBalancing()).toBe(true);
    });
    
    it('should stop auto-balancing', async () => {
      await balancer.startAutoBalancing();
      await balancer.stopAutoBalancing();
      
      expect(balancer.isAutoBalancing()).toBe(false);
    });
    
    it('should rebalance periodically', async (done) => {
      let rebalanceCount = 0;
      
      balancer.on('rebalanced', () => {
        rebalanceCount++;
        if (rebalanceCount >= 2) {
          done();
        }
      });
      
      await balancer.startAutoBalancing();
      
      // Wait for multiple rebalance cycles
      await new Promise(resolve => setTimeout(resolve, 12000));
    });
  });
  
  describe('Configuration Updates', () => {
    it('should update max tasks per session', () => {
      balancer.setMaxTasksPerSession(5);
      
      const config = balancer.getConfig();
      expect(config.maxTasksPerSession).toBe(5);
    });
    
    it('should update balancing interval', () => {
      balancer.setBalancingInterval(10000);
      
      const config = balancer.getConfig();
      expect(config.balancingInterval).toBe(10000);
    });
  });
});
