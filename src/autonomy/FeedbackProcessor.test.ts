/**
 * FeedbackProcessor Tests
 *
 * Tests for learning from user feedback and adaptation.
 * Following TDD: Test file created FIRST, implementation SECOND.
 *
 * Purpose: Process feedback to improve autonomous operation over time.
 */

import { FeedbackProcessor, Feedback, Sentiment, FeedbackCategory, FeedbackInsights } from './FeedbackProcessor';

describe('FeedbackProcessor', () => {
  let processor: FeedbackProcessor;

  beforeEach(() => {
    processor = new FeedbackProcessor();
  });

  describe('Construction', () => {
    it('should create FeedbackProcessor instance', () => {
      expect(processor).toBeInstanceOf(FeedbackProcessor);
    });
  });

  describe('Feedback Processing', () => {
    it('should process feedback and return insights', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'The system works great but could be faster',
        source: 'user',
      };

      const insights = processor.processFeedback(feedback);

      expect(insights).toHaveProperty('sentiment');
      expect(insights).toHaveProperty('category');
      expect(insights).toHaveProperty('actionable');
    });

    it('should extract sentiment from feedback', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'Excellent work! Very impressed.',
        source: 'user',
      };

      const insights = processor.processFeedback(feedback);

      expect(['positive', 'negative', 'neutral']).toContain(insights.sentiment);
    });

    it('should categorize feedback', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'Found a bug in the logging module',
        source: 'user',
      };

      const insights = processor.processFeedback(feedback);

      expect(['bug', 'feature', 'improvement', 'praise', 'question']).toContain(insights.category);
    });
  });

  describe('Sentiment Analysis', () => {
    it('should detect positive sentiment', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'Great job! This is excellent and works perfectly.',
        source: 'user',
      };

      const insights = processor.processFeedback(feedback);

      expect(insights.sentiment).toBe('positive');
    });

    it('should detect negative sentiment', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'This is terrible and broken. Very disappointed.',
        source: 'user',
      };

      const insights = processor.processFeedback(feedback);

      expect(insights.sentiment).toBe('negative');
    });

    it('should detect neutral sentiment', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'The system completed the task.',
        source: 'user',
      };

      const insights = processor.processFeedback(feedback);

      expect(insights.sentiment).toBe('neutral');
    });
  });

  describe('Category Detection', () => {
    it('should detect bug reports', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'Found a critical bug that crashes the system',
        source: 'user',
      };

      const insights = processor.processFeedback(feedback);

      expect(insights.category).toBe('bug');
    });

    it('should detect feature requests', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'Would be great to add support for dark mode',
        source: 'user',
      };

      const insights = processor.processFeedback(feedback);

      expect(insights.category).toBe('feature');
    });

    it('should detect improvement suggestions', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'Could improve performance by caching results',
        source: 'user',
      };

      const insights = processor.processFeedback(feedback);

      expect(insights.category).toBe('improvement');
    });

    it('should detect praise', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'Excellent work! Very well done.',
        source: 'user',
      };

      const insights = processor.processFeedback(feedback);

      expect(insights.category).toBe('praise');
    });
  });

  describe('Actionable Recommendations', () => {
    it('should generate actionable recommendations', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'System is too slow when processing large files',
        source: 'user',
      };

      const insights = processor.processFeedback(feedback);

      expect(insights.recommendations).toBeDefined();
      expect(insights.recommendations.length).toBeGreaterThan(0);
    });

    it('should prioritize recommendations for bugs', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'Critical bug causing data loss',
        source: 'user',
      };

      const insights = processor.processFeedback(feedback);

      expect(insights.actionable).toBe(true);
      expect(insights.recommendations.length).toBeGreaterThan(0);
    });

    it('should mark non-actionable feedback', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'Thanks for the great work!',
        source: 'user',
      };

      const insights = processor.processFeedback(feedback);

      expect(insights.actionable).toBe(false);
    });
  });

  describe('Pattern Recognition', () => {
    it('should detect recurring feedback patterns', () => {
      const feedbacks = [
        { id: 'fb-1', message: 'System is slow', source: 'user' },
        { id: 'fb-2', message: 'Performance issues', source: 'user' },
        { id: 'fb-3', message: 'Too slow to process', source: 'user' },
      ];

      feedbacks.forEach((fb) => processor.processFeedback(fb as Feedback));

      const patterns = processor.detectPatterns();

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toHaveProperty('theme');
      expect(patterns[0]).toHaveProperty('frequency');
    });

    it('should rank patterns by frequency', () => {
      const feedbacks = [
        { id: 'fb-1', message: 'Performance is slow', source: 'user' },
        { id: 'fb-2', message: 'Slow response time', source: 'user' },
        { id: 'fb-3', message: 'Bug in login', source: 'user' },
      ];

      feedbacks.forEach((fb) => processor.processFeedback(fb as Feedback));

      const patterns = processor.detectPatterns();

      // Performance pattern should rank higher (2 mentions vs 1)
      if (patterns.length > 1) {
        expect(patterns[0].frequency).toBeGreaterThanOrEqual(patterns[1].frequency);
      }
    });
  });

  describe('Feedback History', () => {
    it('should track feedback history', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'Test feedback',
        source: 'user',
      };

      processor.processFeedback(feedback);

      const history = processor.getFeedbackHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should include timestamps in history', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: 'Test feedback',
        source: 'user',
      };

      processor.processFeedback(feedback);

      const history = processor.getFeedbackHistory();
      expect(history[0].timestamp).toBeInstanceOf(Date);
    });

    it('should filter history by sentiment', () => {
      const positive: Feedback = {
        id: 'fb-1',
        message: 'Excellent work!',
        source: 'user',
      };

      const negative: Feedback = {
        id: 'fb-2',
        message: 'This is broken',
        source: 'user',
      };

      processor.processFeedback(positive);
      processor.processFeedback(negative);

      const positiveHistory = processor.getFeedbackHistory({ sentiment: 'positive' });
      const negativeHistory = processor.getFeedbackHistory({ sentiment: 'negative' });

      expect(positiveHistory.length).toBeGreaterThan(0);
      expect(negativeHistory.length).toBeGreaterThan(0);
    });

    it('should filter history by category', () => {
      const bug: Feedback = {
        id: 'fb-1',
        message: 'Found a bug',
        source: 'user',
      };

      const feature: Feedback = {
        id: 'fb-2',
        message: 'Add dark mode feature',
        source: 'user',
      };

      processor.processFeedback(bug);
      processor.processFeedback(feature);

      const bugHistory = processor.getFeedbackHistory({ category: 'bug' });
      const featureHistory = processor.getFeedbackHistory({ category: 'feature' });

      expect(bugHistory.length).toBeGreaterThan(0);
      expect(featureHistory.length).toBeGreaterThan(0);
    });
  });

  describe('Sentiment Trends', () => {
    it('should calculate sentiment trends over time', () => {
      const feedbacks = [
        { id: 'fb-1', message: 'Broken and buggy', source: 'user' },
        { id: 'fb-2', message: 'Getting better', source: 'user' },
        { id: 'fb-3', message: 'Excellent now!', source: 'user' },
      ];

      feedbacks.forEach((fb) => processor.processFeedback(fb as Feedback));

      const trends = processor.getSentimentTrends();

      expect(trends).toHaveProperty('trend');
      expect(['improving', 'declining', 'stable']).toContain(trends.trend);
    });

    it('should detect improving sentiment', () => {
      const feedbacks = [
        { id: 'fb-1', message: 'Terrible and broken', source: 'user' },
        { id: 'fb-2', message: 'Better now', source: 'user' },
        { id: 'fb-3', message: 'Great work! Excellent!', source: 'user' },
      ];

      feedbacks.forEach((fb) => processor.processFeedback(fb as Feedback));

      const trends = processor.getSentimentTrends();

      expect(trends.trend).toBe('improving');
    });

    it('should detect declining sentiment', () => {
      const feedbacks = [
        { id: 'fb-1', message: 'Great work!', source: 'user' },
        { id: 'fb-2', message: 'Getting worse', source: 'user' },
        { id: 'fb-3', message: 'Broken and terrible', source: 'user' },
      ];

      feedbacks.forEach((fb) => processor.processFeedback(fb as Feedback));

      const trends = processor.getSentimentTrends();

      expect(trends.trend).toBe('declining');
    });
  });

  describe('Learning Insights', () => {
    it('should generate learning insights from patterns', () => {
      const feedbacks = [
        { id: 'fb-1', message: 'Slow performance', source: 'user' },
        { id: 'fb-2', message: 'Performance issues', source: 'user' },
        { id: 'fb-3', message: 'Too slow', source: 'user' },
      ];

      feedbacks.forEach((fb) => processor.processFeedback(fb as Feedback));

      const insights = processor.getLearningInsights();

      expect(insights).toHaveProperty('topIssues');
      expect(insights.topIssues.length).toBeGreaterThan(0);
    });

    it('should prioritize actionable insights', () => {
      const feedbacks = [
        { id: 'fb-1', message: 'Critical bug needs fixing', source: 'user' },
        { id: 'fb-2', message: 'Thanks for the help', source: 'user' },
      ];

      feedbacks.forEach((fb) => processor.processFeedback(fb as Feedback));

      const insights = processor.getLearningInsights();

      expect(insights.actionableCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty feedback message', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        message: '',
        source: 'user',
      };

      expect(() => processor.processFeedback(feedback)).toThrow();
    });

    it('should handle missing feedback ID', () => {
      const feedback: Feedback = {
        id: '',
        message: 'Test feedback',
        source: 'user',
      };

      expect(() => processor.processFeedback(feedback)).toThrow();
    });
  });

  describe('Statistics', () => {
    it('should provide feedback statistics', () => {
      const feedbacks = [
        { id: 'fb-1', message: 'Great!', source: 'user' },
        { id: 'fb-2', message: 'Bug found', source: 'user' },
        { id: 'fb-3', message: 'Neutral comment', source: 'user' },
      ];

      feedbacks.forEach((fb) => processor.processFeedback(fb as Feedback));

      const stats = processor.getStatistics();

      expect(stats).toHaveProperty('totalFeedback');
      expect(stats).toHaveProperty('sentimentBreakdown');
      expect(stats).toHaveProperty('categoryBreakdown');
    });

    it('should calculate sentiment distribution', () => {
      const feedbacks = [
        { id: 'fb-1', message: 'Excellent!', source: 'user' },
        { id: 'fb-2', message: 'Terrible', source: 'user' },
      ];

      feedbacks.forEach((fb) => processor.processFeedback(fb as Feedback));

      const stats = processor.getStatistics();

      expect(stats.sentimentBreakdown).toHaveProperty('positive');
      expect(stats.sentimentBreakdown).toHaveProperty('negative');
      expect(stats.sentimentBreakdown).toHaveProperty('neutral');
    });
  });
});
