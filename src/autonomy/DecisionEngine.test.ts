/**
 * DecisionEngine Tests
 *
 * Tests for autonomous decision-making under uncertainty.
 * Following TDD: Test file created FIRST, implementation SECOND.
 *
 * Purpose: Make intelligent decisions when facing ambiguity or uncertainty.
 */

import { DecisionEngine, Decision, RiskLevel, DecisionContext } from './DecisionEngine';

describe('DecisionEngine', () => {
  let engine: DecisionEngine;

  beforeEach(() => {
    engine = new DecisionEngine();
  });

  describe('Construction', () => {
    it('should create DecisionEngine instance', () => {
      expect(engine).toBeInstanceOf(DecisionEngine);
    });

    it('should accept custom confidence threshold', () => {
      const customEngine = new DecisionEngine({ confidenceThreshold: 0.8 });
      expect(customEngine).toBeInstanceOf(DecisionEngine);
    });
  });

  describe('Decision Making', () => {
    it('should make decision with confidence score', () => {
      const context: DecisionContext = {
        question: 'Should we proceed with approach A?',
        options: ['Proceed with A', 'Try alternative B', 'Escalate to human'],
        evidence: ['A has worked before', 'A is well-documented'],
      };

      const decision = engine.makeDecision(context);

      expect(decision).toHaveProperty('choice');
      expect(decision).toHaveProperty('confidence');
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(100);
    });

    it('should include rationale in decision', () => {
      const context: DecisionContext = {
        question: 'Should we proceed with approach A?',
        options: ['Proceed with A', 'Try alternative B'],
        evidence: ['A has worked before'],
      };

      const decision = engine.makeDecision(context);

      expect(decision).toHaveProperty('rationale');
      expect(decision.rationale).toBeTruthy();
    });

    it('should choose from provided options', () => {
      const context: DecisionContext = {
        question: 'Which approach?',
        options: ['Option A', 'Option B', 'Option C'],
        evidence: ['Evidence for A'],
      };

      const decision = engine.makeDecision(context);

      expect(context.options).toContain(decision.choice);
    });
  });

  describe('Confidence Scoring', () => {
    it('should give high confidence with strong evidence', () => {
      const context: DecisionContext = {
        question: 'Should we use approach A?',
        options: ['Use A', 'Use B'],
        evidence: [
          'A has succeeded 10 times',
          'A is well-tested',
          'A is documented',
          'A has no known issues',
        ],
      };

      const decision = engine.makeDecision(context);

      expect(decision.confidence).toBeGreaterThan(70);
    });

    it('should give low confidence with weak evidence', () => {
      const context: DecisionContext = {
        question: 'Should we try experimental approach X?',
        options: ['Try X', 'Skip'],
        evidence: ['X might work'],
      };

      const decision = engine.makeDecision(context);

      expect(decision.confidence).toBeLessThan(50);
    });

    it('should give medium confidence with moderate evidence', () => {
      const context: DecisionContext = {
        question: 'Should we use approach A?',
        options: ['Use A', 'Use B'],
        evidence: ['A worked once before', 'A seems reasonable'],
      };

      const decision = engine.makeDecision(context);

      expect(decision.confidence).toBeGreaterThanOrEqual(40);
      expect(decision.confidence).toBeLessThanOrEqual(70);
    });
  });

  describe('Human Escalation', () => {
    it('should recommend escalation for low confidence decisions', () => {
      const context: DecisionContext = {
        question: 'Should we delete production database?',
        options: ['Delete', 'Keep'],
        evidence: ['Unclear requirement'],
      };

      const decision = engine.makeDecision(context);

      expect(decision.requiresHuman).toBe(true);
    });

    it('should not require escalation for high confidence decisions', () => {
      const context: DecisionContext = {
        question: 'Should we continue?',
        options: ['Continue', 'Stop'],
        evidence: [
          'All tests pass',
          'No blockers',
          'Clear path forward',
          'Standard procedure',
        ],
      };

      const decision = engine.makeDecision(context);

      expect(decision.requiresHuman).toBe(false);
    });

    it('should include escalation reason when flagged', () => {
      const context: DecisionContext = {
        question: 'Should we try untested approach?',
        options: ['Try', 'Skip'],
        evidence: ['No prior experience'],
      };

      const decision = engine.makeDecision(context);

      if (decision.requiresHuman) {
        expect(decision.escalationReason).toBeTruthy();
      }
    });
  });

  describe('Risk Assessment', () => {
    it('should assess risk level', () => {
      const context: DecisionContext = {
        question: 'Should we proceed?',
        options: ['Proceed', 'Wait'],
        evidence: ['Some uncertainty'],
      };

      const decision = engine.makeDecision(context);

      expect(decision).toHaveProperty('riskLevel');
      expect(['low', 'medium', 'high']).toContain(decision.riskLevel);
    });

    it('should mark high-risk decisions', () => {
      const context: DecisionContext = {
        question: 'Should we deploy to production?',
        options: ['Deploy', 'Wait'],
        evidence: ['Tests failing', 'Unclear impact'],
      };

      const decision = engine.makeDecision(context);

      expect(decision.riskLevel).toBe('high');
    });

    it('should mark low-risk decisions', () => {
      const context: DecisionContext = {
        question: 'Should we add comment to code?',
        options: ['Add', 'Skip'],
        evidence: ['Low impact', 'Safe change', 'Reversible'],
      };

      const decision = engine.makeDecision(context);

      expect(decision.riskLevel).toBe('low');
    });
  });

  describe('Alternative Evaluation', () => {
    it('should evaluate multiple alternatives', () => {
      const alternatives = [
        { option: 'Approach A', evidence: ['Fast', 'Simple'] },
        { option: 'Approach B', evidence: ['Reliable', 'Well-tested'] },
        { option: 'Approach C', evidence: ['Novel', 'Untested'] },
      ];

      const evaluation = engine.evaluateAlternatives(alternatives);

      expect(evaluation).toHaveLength(3);
      evaluation.forEach((result) => {
        expect(result).toHaveProperty('option');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('riskLevel');
      });
    });

    it('should rank alternatives by confidence', () => {
      const alternatives = [
        { option: 'Weak option', evidence: ['Might work'] },
        { option: 'Strong option', evidence: ['Proven', 'Tested', 'Documented'] },
        { option: 'Medium option', evidence: ['Used before'] },
      ];

      const evaluation = engine.evaluateAlternatives(alternatives);

      // Should be sorted by confidence (descending)
      for (let i = 0; i < evaluation.length - 1; i++) {
        expect(evaluation[i].confidence).toBeGreaterThanOrEqual(evaluation[i + 1].confidence);
      }
    });

    it('should recommend best alternative', () => {
      const alternatives = [
        { option: 'Risky option', evidence: ['Experimental'] },
        { option: 'Safe option', evidence: ['Proven', 'Reliable', 'Standard'] },
      ];

      const best = engine.recommendBestAlternative(alternatives);

      expect(best).toHaveProperty('option');
      expect(best.option).toBe('Safe option');
    });
  });

  describe('Decision History', () => {
    it('should log decisions', () => {
      const context: DecisionContext = {
        question: 'Test decision?',
        options: ['Yes', 'No'],
        evidence: ['Test evidence'],
      };

      engine.makeDecision(context);

      const history = engine.getDecisionHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should include timestamp in history', () => {
      const context: DecisionContext = {
        question: 'Test decision?',
        options: ['Yes', 'No'],
        evidence: ['Test evidence'],
      };

      engine.makeDecision(context);

      const history = engine.getDecisionHistory();
      expect(history[0]).toHaveProperty('timestamp');
      expect(history[0].timestamp).toBeInstanceOf(Date);
    });

    it('should include context in history', () => {
      const context: DecisionContext = {
        question: 'Test decision?',
        options: ['Yes', 'No'],
        evidence: ['Test evidence'],
      };

      engine.makeDecision(context);

      const history = engine.getDecisionHistory();
      expect(history[0]).toHaveProperty('context');
      expect(history[0].context.question).toBe('Test decision?');
    });

    it('should retrieve decisions by filter', () => {
      const context1: DecisionContext = {
        question: 'Question 1?',
        options: ['Yes', 'No'],
        evidence: ['High confidence evidence', 'Strong proof', 'Clear answer'],
      };

      const context2: DecisionContext = {
        question: 'Question 2?',
        options: ['Yes', 'No'],
        evidence: ['Weak evidence'],
      };

      engine.makeDecision(context1);
      engine.makeDecision(context2);

      const lowConfidence = engine.getDecisionHistory({ minConfidence: 0, maxConfidence: 50 });
      const highConfidence = engine.getDecisionHistory({ minConfidence: 70, maxConfidence: 100 });

      expect(lowConfidence.length).toBeGreaterThan(0);
      expect(highConfidence.length).toBeGreaterThan(0);
    });
  });

  describe('Uncertainty Detection', () => {
    it('should detect high uncertainty contexts', () => {
      const context: DecisionContext = {
        question: 'Unknown scenario?',
        options: ['Option A', 'Option B'],
        evidence: [],
      };

      const hasUncertainty = engine.detectUncertainty(context);

      expect(hasUncertainty).toBe(true);
    });

    it('should detect low uncertainty contexts', () => {
      const context: DecisionContext = {
        question: 'Clear scenario?',
        options: ['Clear choice'],
        evidence: ['Strong evidence', 'Clear path', 'No ambiguity'],
      };

      const hasUncertainty = engine.detectUncertainty(context);

      expect(hasUncertainty).toBe(false);
    });

    it('should quantify uncertainty level', () => {
      const context: DecisionContext = {
        question: 'Moderately unclear?',
        options: ['A', 'B', 'C'],
        evidence: ['Some evidence'],
      };

      const uncertaintyScore = engine.quantifyUncertainty(context);

      expect(uncertaintyScore).toBeGreaterThanOrEqual(0);
      expect(uncertaintyScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    it('should throw for empty options', () => {
      const context: DecisionContext = {
        question: 'Question?',
        options: [],
        evidence: ['Evidence'],
      };

      expect(() => engine.makeDecision(context)).toThrow();
    });

    it('should throw for invalid confidence threshold', () => {
      expect(() => new DecisionEngine({ confidenceThreshold: 1.5 })).toThrow();
    });

    it('should handle missing evidence gracefully', () => {
      const context: DecisionContext = {
        question: 'Question?',
        options: ['Option A'],
        evidence: [],
      };

      const decision = engine.makeDecision(context);

      expect(decision).toBeDefined();
      expect(decision.confidence).toBeLessThan(50);
    });
  });

  describe('Configuration', () => {
    it('should use custom confidence threshold for escalation', () => {
      const strictEngine = new DecisionEngine({ confidenceThreshold: 0.9 });

      const context: DecisionContext = {
        question: 'Moderate confidence scenario?',
        options: ['Yes', 'No'],
        evidence: ['Some evidence', 'Reasonable assumption'],
      };

      const decision = strictEngine.makeDecision(context);

      // With 90% threshold, moderate confidence should trigger escalation
      expect(decision.requiresHuman).toBe(true);
    });

    it('should respect minimum confidence for autonomous decisions', () => {
      const lenientEngine = new DecisionEngine({ confidenceThreshold: 0.3 });

      const context: DecisionContext = {
        question: 'Low confidence scenario?',
        options: ['Yes', 'No'],
        evidence: ['Weak evidence'],
      };

      const decision = lenientEngine.makeDecision(context);

      // With 30% threshold, even weak evidence might be okay
      expect(decision).toBeDefined();
    });
  });
});
