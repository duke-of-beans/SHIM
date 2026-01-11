/**
 * AutoRestarter Tests
 * 
 * Tests for automatic Claude Desktop restart and chat navigation.
 * Following TDD: Test file created FIRST, implementation SECOND.
 */

import { AutoRestarter, RestartConfig, RestartResult } from './AutoRestarter';
import * as path from 'path';
import * as fs from 'fs';

describe('AutoRestarter', () => {
  let restarter: AutoRestarter;
  
  const mockConfig: RestartConfig = {
    claudeExePath: 'C:\\Users\\Test\\AppData\\Local\\Programs\\Claude\\Claude.exe',
    chatUrl: 'https://claude.ai/chat/abc123',
    launchDelay: 2000,
    navigationDelay: 3000
  };
  
  beforeEach(() => {
    restarter = new AutoRestarter(mockConfig);
  });
  
  describe('Construction', () => {
    it('should create AutoRestarter instance', () => {
      expect(restarter).toBeInstanceOf(AutoRestarter);
    });
    
    it('should accept restart configuration', () => {
      const config: RestartConfig = {
        claudeExePath: 'C:\\Custom\\Path\\Claude.exe',
        chatUrl: 'https://claude.ai/chat/xyz789'
      };
      
      const customRestarter = new AutoRestarter(config);
      expect(customRestarter).toBeInstanceOf(AutoRestarter);
    });
    
    it('should validate exe path exists', () => {
      const invalidConfig: RestartConfig = {
        claudeExePath: 'C:\\NonExistent\\Claude.exe',
        chatUrl: 'https://claude.ai/chat/test'
      };
      
      expect(() => new AutoRestarter(invalidConfig)).toThrow('Claude executable not found');
    });
    
    it('should validate chat URL format', () => {
      const invalidConfig: RestartConfig = {
        claudeExePath: mockConfig.claudeExePath,
        chatUrl: 'not-a-valid-url'
      };
      
      expect(() => new AutoRestarter(invalidConfig)).toThrow('Invalid chat URL');
    });
    
    it('should use default delays if not specified', () => {
      const minimalConfig: RestartConfig = {
        claudeExePath: mockConfig.claudeExePath,
        chatUrl: mockConfig.chatUrl
      };
      
      const defaultRestarter = new AutoRestarter(minimalConfig);
      expect(defaultRestarter).toBeInstanceOf(AutoRestarter);
    });
  });
  
  describe('Executable Detection', () => {
    it('should find Claude.exe in default locations', () => {
      const found = AutoRestarter.findClaudeExecutable();
      
      if (found) {
        expect(found).toContain('Claude.exe');
        expect(fs.existsSync(found)).toBe(true);
      }
    });
    
    it('should check multiple default paths', () => {
      const paths = AutoRestarter.getDefaultClaudePaths();
      
      expect(paths.length).toBeGreaterThan(0);
      paths.forEach(p => {
        expect(p).toContain('Claude.exe');
      });
    });
    
    it('should return null if not found in default paths', () => {
      // This test assumes Claude might not be installed
      const found = AutoRestarter.findClaudeExecutable();
      
      // Result can be either string or null
      expect(typeof found === 'string' || found === null).toBe(true);
    });
  });
  
  describe('Process Launch', () => {
    it('should launch Claude Desktop process', async () => {
      // Mock process launch - don't actually launch in tests
      const result = await restarter.launchClaude({ dryRun: true });
      
      expect(result.success).toBe(true);
      expect(result.phase).toBe('launched');
      expect(result).toHaveProperty('pid');
    });
    
    it('should wait for launch delay before returning', async () => {
      const startTime = Date.now();
      
      await restarter.launchClaude({ dryRun: true });
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(mockConfig.launchDelay! - 100);
    });
    
    it('should detect if Claude is already running', async () => {
      // If Claude is already running, should skip launch
      const result = await restarter.launchClaude({ 
        dryRun: true,
        skipIfRunning: true 
      });
      
      expect(result).toHaveProperty('alreadyRunning');
    });
    
    it('should return PID of launched process', async () => {
      const result = await restarter.launchClaude({ dryRun: true });
      
      if (result.success) {
        expect(result.pid).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Chat Navigation', () => {
    it('should navigate to chat URL', async () => {
      const result = await restarter.navigateToChat({ dryRun: true });
      
      expect(result.success).toBe(true);
      expect(result.phase).toBe('navigated');
      expect(result.chatUrl).toBe(mockConfig.chatUrl);
    });
    
    it('should wait for navigation delay', async () => {
      const startTime = Date.now();
      
      await restarter.navigateToChat({ dryRun: true });
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(mockConfig.navigationDelay! - 100);
    });
    
    it('should use system default browser', async () => {
      const result = await restarter.navigateToChat({ dryRun: true });
      
      expect(result).toHaveProperty('method');
      expect(result.method).toMatch(/start|open/);
    });
    
    it('should handle navigation errors gracefully', async () => {
      const badRestarter = new AutoRestarter({
        ...mockConfig,
        chatUrl: 'https://invalid-domain-12345.com/chat/test'
      });
      
      const result = await badRestarter.navigateToChat({ dryRun: true });
      
      // Should not throw, just return error in result
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
    });
  });
  
  describe('MCP Resume Trigger', () => {
    it('should trigger SHIM MCP resume command', async () => {
      const result = await restarter.triggerResume({ dryRun: true });
      
      expect(result.success).toBe(true);
      expect(result.phase).toBe('resume_triggered');
      expect(result).toHaveProperty('mcpCommand');
    });
    
    it('should use check_resume_needed MCP tool', async () => {
      const result = await restarter.triggerResume({ dryRun: true });
      
      if (result.success) {
        expect(result.mcpCommand).toContain('check_resume_needed');
      }
    });
    
    it('should handle MCP communication errors', async () => {
      // Test MCP server unreachable scenario
      const result = await restarter.triggerResume({ 
        dryRun: true,
        mcpTimeout: 100 
      });
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
    });
    
    it('should include project context in resume trigger', async () => {
      const result = await restarter.triggerResume({ 
        dryRun: true,
        project: 'shim' 
      });
      
      if (result.success && result.mcpCommand) {
        expect(result.mcpCommand).toContain('shim');
      }
    });
  });
  
  describe('Full Restart Flow', () => {
    it('should execute complete restart sequence', async () => {
      const result = await restarter.restart({ dryRun: true });
      
      expect(result.success).toBe(true);
      expect(result.phases).toContain('launched');
      expect(result.phases).toContain('navigated');
      expect(result.phases).toContain('resume_triggered');
    });
    
    it('should execute phases in correct order', async () => {
      const result = await restarter.restart({ dryRun: true });
      
      const expectedOrder = ['launched', 'navigated', 'resume_triggered'];
      expect(result.phases).toEqual(expectedOrder);
    });
    
    it('should measure total restart duration', async () => {
      const result = await restarter.restart({ dryRun: true });
      
      expect(result).toHaveProperty('totalDuration');
      expect(result.totalDuration).toBeGreaterThan(0);
    });
    
    it('should handle partial failures gracefully', async () => {
      // Test scenario where launch succeeds but navigation fails
      const result = await restarter.restart({ 
        dryRun: true,
        failAt: 'navigate' 
      });
      
      expect(result.success).toBe(false);
      expect(result.phases).toContain('launched');
      expect(result.phases).not.toContain('resume_triggered');
      expect(result.error).toBeDefined();
    });
    
    it('should cleanup on error', async () => {
      const result = await restarter.restart({ 
        dryRun: true,
        failAt: 'navigate' 
      });
      
      // Should have cleanup phase
      expect(result).toHaveProperty('cleaned');
    });
  });
  
  describe('Status Monitoring', () => {
    it('should report restart status', () => {
      const status = restarter.getStatus();
      
      expect(status).toHaveProperty('isRestarting');
      expect(status).toHaveProperty('currentPhase');
      expect(status).toHaveProperty('lastRestart');
    });
    
    it('should track last restart timestamp', async () => {
      await restarter.restart({ dryRun: true });
      
      const status = restarter.getStatus();
      expect(status.lastRestart).toBeDefined();
      expect(new Date(status.lastRestart!).getTime()).toBeLessThanOrEqual(Date.now());
    });
    
    it('should track restart count', async () => {
      const status1 = restarter.getStatus();
      const initialCount = status1.restartCount || 0;
      
      await restarter.restart({ dryRun: true });
      
      const status2 = restarter.getStatus();
      expect(status2.restartCount).toBe(initialCount + 1);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle exe not found error', async () => {
      const badRestarter = new AutoRestarter({
        claudeExePath: 'C:\\NonExistent\\Claude.exe',
        chatUrl: mockConfig.chatUrl,
        validateExePath: false  // Skip validation in constructor
      });
      
      const result = await badRestarter.launchClaude({ dryRun: true });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
    
    it('should timeout if launch takes too long', async () => {
      const result = await restarter.launchClaude({ 
        dryRun: true,
        timeout: 100 
      });
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
    });
    
    it('should handle process spawn errors', async () => {
      // Test handling of spawn errors
      const result = await restarter.launchClaude({ dryRun: true });
      
      expect(result).toHaveProperty('success');
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
  
  describe('Configuration Validation', () => {
    it('should reject empty exe path', () => {
      expect(() => new AutoRestarter({
        claudeExePath: '',
        chatUrl: mockConfig.chatUrl
      })).toThrow();
    });
    
    it('should reject empty chat URL', () => {
      expect(() => new AutoRestarter({
        claudeExePath: mockConfig.claudeExePath,
        chatUrl: ''
      })).toThrow();
    });
    
    it('should accept custom delays', () => {
      const customRestarter = new AutoRestarter({
        claudeExePath: mockConfig.claudeExePath,
        chatUrl: mockConfig.chatUrl,
        launchDelay: 5000,
        navigationDelay: 10000
      });
      
      expect(customRestarter).toBeInstanceOf(AutoRestarter);
    });
    
    it('should use reasonable default delays', () => {
      const defaultRestarter = new AutoRestarter({
        claudeExePath: mockConfig.claudeExePath,
        chatUrl: mockConfig.chatUrl
      });
      
      const status = defaultRestarter.getStatus();
      expect(status).toBeDefined();
    });
  });
  
  describe('Integration Scenarios', () => {
    it('should work with ProcessMonitor crash event', async () => {
      // Simulate receiving crash event from ProcessMonitor
      const crashEvent = {
        type: 'crash' as const,
        pid: 12345,
        timestamp: new Date().toISOString(),
        metadata: {
          hadRecentCheckpoint: true,
          lastCheckpointAge: 2.5
        }
      };
      
      // AutoRestarter should handle this
      const result = await restarter.restart({ 
        dryRun: true,
        crashEvent 
      });
      
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('crashContext');
    });
    
    it('should include crash metadata in restart', async () => {
      const result = await restarter.restart({ 
        dryRun: true,
        crashEvent: {
          type: 'crash',
          pid: 12345,
          timestamp: new Date().toISOString(),
          metadata: { hadRecentCheckpoint: true }
        }
      });
      
      if (result.crashContext) {
        expect(result.crashContext.pid).toBe(12345);
        expect(result.crashContext.hadRecentCheckpoint).toBe(true);
      }
    });
  });
});
