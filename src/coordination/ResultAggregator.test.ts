/**
 * ResultAggregator Tests
 *
 * Tests for aggregating results from distributed tasks.
 * Following TDD: Test file created FIRST, implementation SECOND.
 */

import { ResultAggregator, TaskResult, AggregationStrategy } from './ResultAggregator';

describe('ResultAggregator', () => {
  let aggregator: ResultAggregator;

  beforeEach(() => {
    aggregator = new ResultAggregator();
  });

  describe('Construction', () => {
    it('should create ResultAggregator instance', () => {
      expect(aggregator).toBeInstanceOf(ResultAggregator);
    });
  });

  describe('Result Collection', () => {
    it('should collect task result', () => {
      const result: TaskResult = {
        taskId: 'task-1',
        chatId: 'chat-1',
        status: 'success',
        data: { value: 42 },
        completedAt: new Date(),
      };

      aggregator.addResult(result);

      const collected = aggregator.getResult('task-1');
      expect(collected).toEqual(result);
    });

    it('should handle multiple results', () => {
      const result1: TaskResult = {
        taskId: 'task-1',
        chatId: 'chat-1',
        status: 'success',
        data: {},
        completedAt: new Date(),
      };

      const result2: TaskResult = {
        taskId: 'task-2',
        chatId: 'chat-2',
        status: 'success',
        data: {},
        completedAt: new Date(),
      };

      aggregator.addResult(result1);
      aggregator.addResult(result2);

      const all = aggregator.getAllResults();
      expect(all.length).toBe(2);
    });
  });

  describe('Result Aggregation', () => {
    it('should aggregate results by task group', () => {
      const result1: TaskResult = {
        taskId: 'task-1',
        chatId: 'chat-1',
        status: 'success',
        data: { count: 10 },
        completedAt: new Date(),
        groupId: 'group-1',
      };

      const result2: TaskResult = {
        taskId: 'task-2',
        chatId: 'chat-2',
        status: 'success',
        data: { count: 20 },
        completedAt: new Date(),
        groupId: 'group-1',
      };

      aggregator.addResult(result1);
      aggregator.addResult(result2);

      const grouped = aggregator.getResultsByGroup('group-1');
      expect(grouped.length).toBe(2);
    });

    it('should merge data from multiple results', () => {
      const result1: TaskResult = {
        taskId: 'task-1',
        chatId: 'chat-1',
        status: 'success',
        data: { a: 1 },
        completedAt: new Date(),
        groupId: 'merge-test',
      };

      const result2: TaskResult = {
        taskId: 'task-2',
        chatId: 'chat-2',
        status: 'success',
        data: { b: 2 },
        completedAt: new Date(),
        groupId: 'merge-test',
      };

      aggregator.addResult(result1);
      aggregator.addResult(result2);

      const merged = aggregator.mergeResults('merge-test');
      expect(merged.a).toBe(1);
      expect(merged.b).toBe(2);
    });
  });

  describe('Completion Tracking', () => {
    it('should check if all tasks complete', () => {
      const taskIds = ['task-1', 'task-2'];

      aggregator.addResult({
        taskId: 'task-1',
        chatId: 'chat-1',
        status: 'success',
        data: {},
        completedAt: new Date(),
      });

      expect(aggregator.isGroupComplete(taskIds)).toBe(false);

      aggregator.addResult({
        taskId: 'task-2',
        chatId: 'chat-2',
        status: 'success',
        data: {},
        completedAt: new Date(),
      });

      expect(aggregator.isGroupComplete(taskIds)).toBe(true);
    });

    it('should track partial completion', () => {
      const taskIds = ['task-1', 'task-2', 'task-3'];

      aggregator.addResult({
        taskId: 'task-1',
        chatId: 'chat-1',
        status: 'success',
        data: {},
        completedAt: new Date(),
      });

      const progress = aggregator.getProgress(taskIds);
      expect(progress).toBeCloseTo(0.33, 1);
    });
  });

  describe('Error Handling', () => {
    it('should track failed results', () => {
      const result: TaskResult = {
        taskId: 'task-1',
        chatId: 'chat-1',
        status: 'failed',
        data: {},
        error: 'Test error',
        completedAt: new Date(),
      };

      aggregator.addResult(result);

      const failed = aggregator.getFailedResults();
      expect(failed.length).toBe(1);
      expect(failed[0].error).toBe('Test error');
    });

    it('should separate successful and failed results', () => {
      aggregator.addResult({
        taskId: 'task-1',
        chatId: 'chat-1',
        status: 'success',
        data: {},
        completedAt: new Date(),
      });

      aggregator.addResult({
        taskId: 'task-2',
        chatId: 'chat-2',
        status: 'failed',
        data: {},
        error: 'Failed',
        completedAt: new Date(),
      });

      const successful = aggregator.getSuccessfulResults();
      const failed = aggregator.getFailedResults();

      expect(successful.length).toBe(1);
      expect(failed.length).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should provide aggregation statistics', () => {
      aggregator.addResult({
        taskId: 'task-1',
        chatId: 'chat-1',
        status: 'success',
        data: {},
        completedAt: new Date(),
      });

      aggregator.addResult({
        taskId: 'task-2',
        chatId: 'chat-2',
        status: 'failed',
        data: {},
        error: 'Error',
        completedAt: new Date(),
      });

      const stats = aggregator.getStatistics();
      expect(stats.total).toBe(2);
      expect(stats.successful).toBe(1);
      expect(stats.failed).toBe(1);
    });
  });
});
