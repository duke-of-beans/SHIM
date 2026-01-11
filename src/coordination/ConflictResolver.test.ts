/**
 * ConflictResolver Tests
 *
 * Tests for resolving conflicts in concurrent modifications.
 * Following TDD: Test file created FIRST, implementation SECOND.
 */

import { ConflictResolver, Modification, ConflictResolution, ResolutionStrategy } from './ConflictResolver';

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
  });

  describe('Construction', () => {
    it('should create ConflictResolver instance', () => {
      expect(resolver).toBeInstanceOf(ConflictResolver);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect conflicting modifications', () => {
      const mod1: Modification = {
        id: 'mod-1',
        filePath: 'test.ts',
        chatId: 'chat-1',
        content: 'const x = 1;',
        timestamp: new Date(),
      };

      const mod2: Modification = {
        id: 'mod-2',
        filePath: 'test.ts',
        chatId: 'chat-2',
        content: 'const x = 2;',
        timestamp: new Date(),
      };

      const hasConflict = resolver.detectConflict(mod1, mod2);
      expect(hasConflict).toBe(true);
    });

    it('should not detect conflict for different files', () => {
      const mod1: Modification = {
        id: 'mod-1',
        filePath: 'file1.ts',
        chatId: 'chat-1',
        content: 'code',
        timestamp: new Date(),
      };

      const mod2: Modification = {
        id: 'mod-2',
        filePath: 'file2.ts',
        chatId: 'chat-2',
        content: 'code',
        timestamp: new Date(),
      };

      const hasConflict = resolver.detectConflict(mod1, mod2);
      expect(hasConflict).toBe(false);
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflict using latest timestamp', () => {
      const earlier = new Date(Date.now() - 1000);
      const later = new Date();

      const mod1: Modification = {
        id: 'mod-1',
        filePath: 'test.ts',
        chatId: 'chat-1',
        content: 'old',
        timestamp: earlier,
      };

      const mod2: Modification = {
        id: 'mod-2',
        filePath: 'test.ts',
        chatId: 'chat-2',
        content: 'new',
        timestamp: later,
      };

      const resolution = resolver.resolveConflict(mod1, mod2, 'latest');
      expect(resolution.winner).toBe(mod2);
    });

    it('should merge non-conflicting changes', () => {
      const mod1: Modification = {
        id: 'mod-1',
        filePath: 'test.ts',
        chatId: 'chat-1',
        content: 'const a = 1;',
        timestamp: new Date(),
      };

      const mod2: Modification = {
        id: 'mod-2',
        filePath: 'test.ts',
        chatId: 'chat-2',
        content: 'const b = 2;',
        timestamp: new Date(),
      };

      const resolution = resolver.resolveConflict(mod1, mod2, 'merge');
      expect(resolution.merged).toBeDefined();
      expect(resolution.merged).toContain('const a');
      expect(resolution.merged).toContain('const b');
    });
  });

  describe('Priority-Based Resolution', () => {
    it('should resolve using chat priority', () => {
      resolver.setChatPriority('chat-1', 10);
      resolver.setChatPriority('chat-2', 5);

      const mod1: Modification = {
        id: 'mod-1',
        filePath: 'test.ts',
        chatId: 'chat-1',
        content: 'high priority',
        timestamp: new Date(),
      };

      const mod2: Modification = {
        id: 'mod-2',
        filePath: 'test.ts',
        chatId: 'chat-2',
        content: 'low priority',
        timestamp: new Date(),
      };

      const resolution = resolver.resolveConflict(mod1, mod2, 'priority');
      expect(resolution.winner).toBe(mod1);
    });
  });

  describe('Conflict Tracking', () => {
    it('should track resolved conflicts', () => {
      const mod1: Modification = {
        id: 'mod-1',
        filePath: 'test.ts',
        chatId: 'chat-1',
        content: 'a',
        timestamp: new Date(),
      };

      const mod2: Modification = {
        id: 'mod-2',
        filePath: 'test.ts',
        chatId: 'chat-2',
        content: 'b',
        timestamp: new Date(),
      };

      resolver.resolveConflict(mod1, mod2, 'latest');

      const history = resolver.getConflictHistory();
      expect(history.length).toBe(1);
    });

    it('should provide conflict statistics', () => {
      const mod1: Modification = {
        id: 'mod-1',
        filePath: 'test.ts',
        chatId: 'chat-1',
        content: 'a',
        timestamp: new Date(),
      };

      const mod2: Modification = {
        id: 'mod-2',
        filePath: 'test.ts',
        chatId: 'chat-2',
        content: 'b',
        timestamp: new Date(),
      };

      resolver.resolveConflict(mod1, mod2, 'latest');

      const stats = resolver.getStatistics();
      expect(stats.totalConflicts).toBe(1);
    });
  });
});
