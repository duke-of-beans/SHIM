/**
 * PromptAnalyzer Tests
 * 
 * Tests for analyzing prompt complexity to enable intelligent model routing.
 * Following TDD: Test file created FIRST, implementation SECOND.
 * 
 * Purpose: Analyze prompts to determine:
 * - Complexity level (simple/medium/complex)
 * - Required capabilities (reasoning, creativity, code)
 * - Optimal model selection
 * - Cost estimation
 * 
 * This enables automatic routing to the right model for each task.
 */

import { PromptAnalyzer, PromptAnalysis, ComplexityLevel } from './PromptAnalyzer';

describe('PromptAnalyzer', () => {
  let analyzer: PromptAnalyzer;
  
  beforeEach(() => {
    analyzer = new PromptAnalyzer();
  });
  
  describe('Construction', () => {
    it('should create PromptAnalyzer instance', () => {
      expect(analyzer).toBeInstanceOf(PromptAnalyzer);
    });
  });
  
  describe('Complexity Detection', () => {
    it('should detect simple queries', () => {
      const prompts = [
        'What is the capital of France?',
        'Define recursion',
        'When was JavaScript created?',
        'Hello, how are you?',
      ];
      
      prompts.forEach(prompt => {
        const analysis = analyzer.analyze(prompt);
        expect(analysis.complexity).toBe('simple');
      });
    });
    
    it('should detect medium complexity', () => {
      const prompts = [
        'Explain how async/await works in JavaScript',
        'Compare React and Vue frameworks',
        'What are the benefits of TypeScript?',
        'How does Redis handle persistence?',
      ];
      
      prompts.forEach(prompt => {
        const analysis = analyzer.analyze(prompt);
        expect(analysis.complexity).toBe('medium');
      });
    });
    
    it('should detect complex queries', () => {
      const prompts = [
        'Design a distributed system for real-time analytics with fault tolerance',
        'Implement a self-balancing binary search tree with explanation',
        'Analyze the tradeoffs between microservices and monolithic architecture',
        'Create a comprehensive test strategy for a large codebase',
      ];
      
      prompts.forEach(prompt => {
        const analysis = analyzer.analyze(prompt);
        expect(analysis.complexity).toBe('complex');
      });
    });
    
    it('should consider prompt length', () => {
      const shortPrompt = 'What is X?';
      const longPrompt = 'What is X? '.repeat(50);
      
      const shortAnalysis = analyzer.analyze(shortPrompt);
      const longAnalysis = analyzer.analyze(longPrompt);
      
      expect(shortAnalysis.complexity).toBe('simple');
      expect(longAnalysis.complexity).not.toBe('simple');
    });
  });
  
  describe('Capability Detection', () => {
    it('should detect reasoning requirements', () => {
      const prompts = [
        'Why does this code fail?',
        'Explain the reasoning behind this design',
        'What would happen if we changed this parameter?',
      ];
      
      prompts.forEach(prompt => {
        const analysis = analyzer.analyze(prompt);
        expect(analysis.requiresReasoning).toBe(true);
      });
    });
    
    it('should detect creativity requirements', () => {
      const prompts = [
        'Write a creative story about AI',
        'Generate unique variable names',
        'Design an innovative user interface',
      ];
      
      prompts.forEach(prompt => {
        const analysis = analyzer.analyze(prompt);
        expect(analysis.requiresCreativity).toBe(true);
      });
    });
    
    it('should detect code generation', () => {
      const prompts = [
        'Write a function to sort an array',
        'Implement a REST API endpoint',
        'Create a React component',
        'Code a binary search algorithm',
      ];
      
      prompts.forEach(prompt => {
        const analysis = analyzer.analyze(prompt);
        expect(analysis.hasCodeGeneration).toBe(true);
      });
    });
    
    it('should detect multiple capabilities', () => {
      const prompt = 'Design and implement a creative solution for sorting with explanation';
      
      const analysis = analyzer.analyze(prompt);
      
      expect(analysis.requiresReasoning).toBe(true);
      expect(analysis.requiresCreativity).toBe(true);
      expect(analysis.hasCodeGeneration).toBe(true);
    });
  });
  
  describe('Keyword Extraction', () => {
    it('should extract technical keywords', () => {
      const prompt = 'Explain React hooks and TypeScript generics';
      
      const analysis = analyzer.analyze(prompt);
      
      expect(analysis.keywords).toContain('react');
      expect(analysis.keywords).toContain('hooks');
      expect(analysis.keywords).toContain('typescript');
      expect(analysis.keywords).toContain('generics');
    });
    
    it('should normalize keywords', () => {
      const prompt = 'REACT React react';
      
      const analysis = analyzer.analyze(prompt);
      
      // Should deduplicate and lowercase
      const reactCount = analysis.keywords.filter(k => k === 'react').length;
      expect(reactCount).toBe(1);
    });
    
    it('should filter common words', () => {
      const prompt = 'What is the best way to implement this?';
      
      const analysis = analyzer.analyze(prompt);
      
      // Should not include common words like 'what', 'is', 'the'
      expect(analysis.keywords).not.toContain('what');
      expect(analysis.keywords).not.toContain('is');
      expect(analysis.keywords).not.toContain('the');
    });
  });
  
  describe('Model Recommendations', () => {
    it('should recommend Haiku for simple queries', () => {
      const prompt = 'What is X?';
      
      const analysis = analyzer.analyze(prompt);
      
      expect(analysis.recommendedModel).toBe('haiku');
    });
    
    it('should recommend Sonnet for medium complexity', () => {
      const prompt = 'Explain how async/await works in JavaScript';
      
      const analysis = analyzer.analyze(prompt);
      
      expect(analysis.recommendedModel).toBe('sonnet');
    });
    
    it('should recommend Opus for complex queries', () => {
      const prompt = 'Design a distributed system with fault tolerance and explain tradeoffs';
      
      const analysis = analyzer.analyze(prompt);
      
      expect(analysis.recommendedModel).toBe('opus');
    });
    
    it('should recommend Opus for code generation', () => {
      const prompt = 'Implement a self-balancing binary search tree';
      
      const analysis = analyzer.analyze(prompt);
      
      expect(analysis.recommendedModel).toBe('opus');
    });
  });
  
  describe('Confidence Scoring', () => {
    it('should have high confidence for clear cases', () => {
      const simplePrompt = 'What is 2+2?';
      const complexPrompt = 'Design a distributed consensus algorithm with Byzantine fault tolerance';
      
      const simpleAnalysis = analyzer.analyze(simplePrompt);
      const complexAnalysis = analyzer.analyze(complexPrompt);
      
      expect(simpleAnalysis.confidence).toBeGreaterThan(0.8);
      expect(complexAnalysis.confidence).toBeGreaterThan(0.8);
    });
    
    it('should have lower confidence for ambiguous cases', () => {
      const ambiguousPrompt = 'Tell me about things';
      
      const analysis = analyzer.analyze(ambiguousPrompt);
      
      expect(analysis.confidence).toBeLessThan(0.7);
    });
  });
  
  describe('Task Classification', () => {
    it('should classify as question', () => {
      const prompts = [
        'What is X?',
        'How does Y work?',
        'Why is Z important?',
      ];
      
      prompts.forEach(prompt => {
        const analysis = analyzer.analyze(prompt);
        expect(analysis.taskType).toBe('question');
      });
    });
    
    it('should classify as code_generation', () => {
      const prompts = [
        'Write a function to X',
        'Implement Y algorithm',
        'Create a component for Z',
      ];
      
      prompts.forEach(prompt => {
        const analysis = analyzer.analyze(prompt);
        expect(analysis.taskType).toBe('code_generation');
      });
    });
    
    it('should classify as explanation', () => {
      const prompts = [
        'Explain how X works',
        'Describe the process of Y',
        'Walk me through Z',
      ];
      
      prompts.forEach(prompt => {
        const analysis = analyzer.analyze(prompt);
        expect(analysis.taskType).toBe('explanation');
      });
    });
    
    it('should classify as design', () => {
      const prompts = [
        'Design a system for X',
        'Architect a solution for Y',
        'Plan an approach to Z',
      ];
      
      prompts.forEach(prompt => {
        const analysis = analyzer.analyze(prompt);
        expect(analysis.taskType).toBe('design');
      });
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty prompt', () => {
      const analysis = analyzer.analyze('');
      
      expect(analysis.complexity).toBe('simple');
      expect(analysis.confidence).toBeLessThan(0.5);
    });
    
    it('should handle very long prompts', () => {
      const longPrompt = 'X '.repeat(1000);
      
      const analysis = analyzer.analyze(longPrompt);
      
      expect(analysis.complexity).toBe('complex');
    });
    
    it('should handle special characters', () => {
      const prompt = '@#$%^&*() !!??';
      
      const analysis = analyzer.analyze(prompt);
      
      expect(analysis).toHaveProperty('complexity');
    });
  });
  
  describe('Batch Analysis', () => {
    it('should analyze multiple prompts', () => {
      const prompts = [
        'What is X?',
        'Explain Y',
        'Implement Z',
      ];
      
      const analyses = analyzer.analyzeMultiple(prompts);
      
      expect(analyses.length).toBe(3);
      expect(analyses[0].complexity).toBe('simple');
    });
  });
});
