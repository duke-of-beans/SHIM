/**
 * FeedbackProcessor
 *
 * Learn from user feedback and adapt autonomous behavior.
 * Analyzes sentiment, categorizes feedback, and extracts actionable insights.
 *
 * Part of Phase 5: Autonomous Operation
 * Component 8/8 - FINAL COMPONENT
 */

export type Sentiment = 'positive' | 'negative' | 'neutral';
export type FeedbackCategory = 'bug' | 'feature' | 'improvement' | 'praise' | 'question';

export interface Feedback {
  id: string;
  message: string;
  source: string;
}

export interface FeedbackInsights {
  feedbackId: string;
  sentiment: Sentiment;
  category: FeedbackCategory;
  actionable: boolean;
  recommendations: string[];
  timestamp: Date;
}

export interface FeedbackPattern {
  theme: string;
  frequency: number;
  examples: string[];
}

export interface FeedbackHistoryRecord {
  feedback: Feedback;
  insights: FeedbackInsights;
  timestamp: Date;
}

export interface FeedbackHistoryFilter {
  sentiment?: Sentiment;
  category?: FeedbackCategory;
  actionable?: boolean;
}

export interface SentimentTrends {
  trend: 'improving' | 'declining' | 'stable';
  sentimentScores: number[];
}

export interface LearningInsights {
  topIssues: string[];
  actionableCount: number;
  mostCommonCategory: FeedbackCategory;
}

export interface FeedbackStatistics {
  totalFeedback: number;
  sentimentBreakdown: Record<Sentiment, number>;
  categoryBreakdown: Record<FeedbackCategory, number>;
}

export class FeedbackProcessor {
  private history: FeedbackHistoryRecord[];

  constructor() {
    this.history = [];
  }

  /**
   * Process feedback and extract insights
   */
  processFeedback(feedback: Feedback): FeedbackInsights {
    if (!feedback.id) {
      throw new Error('Feedback must have an ID');
    }

    if (!feedback.message || feedback.message.trim().length === 0) {
      throw new Error('Feedback message cannot be empty');
    }

    const sentiment = this.analyzeSentiment(feedback.message);
    const category = this.categorize(feedback.message);
    const actionable = this.isActionable(category, sentiment);
    const recommendations = this.generateRecommendations(feedback.message, category);

    const insights: FeedbackInsights = {
      feedbackId: feedback.id,
      sentiment,
      category,
      actionable,
      recommendations,
      timestamp: new Date(),
    };

    // Record in history
    this.history.push({
      feedback,
      insights,
      timestamp: new Date(),
    });

    return insights;
  }

  /**
   * Detect recurring patterns in feedback
   */
  detectPatterns(): FeedbackPattern[] {
    const themes = new Map<string, string[]>();

    // Extract themes from feedback
    this.history.forEach((record) => {
      const message = record.feedback.message.toLowerCase();

      // Common themes to look for
      const themeKeywords = {
        performance: ['slow', 'performance', 'fast', 'speed', 'lag'],
        bugs: ['bug', 'error', 'crash', 'broken', 'fail'],
        usability: ['confusing', 'difficult', 'hard', 'unclear', 'complicated'],
        features: ['feature', 'add', 'want', 'wish', 'would be great'],
      };

      Object.entries(themeKeywords).forEach(([theme, keywords]) => {
        if (keywords.some((kw) => message.includes(kw))) {
          if (!themes.has(theme)) {
            themes.set(theme, []);
          }
          themes.get(theme)!.push(record.feedback.message);
        }
      });
    });

    // Convert to patterns and sort by frequency
    const patterns: FeedbackPattern[] = [];
    themes.forEach((examples, theme) => {
      patterns.push({
        theme,
        frequency: examples.length,
        examples: examples.slice(0, 3), // Top 3 examples
      });
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get feedback history
   */
  getFeedbackHistory(filter?: FeedbackHistoryFilter): FeedbackHistoryRecord[] {
    let results = [...this.history];

    if (filter) {
      if (filter.sentiment) {
        results = results.filter((r) => r.insights.sentiment === filter.sentiment);
      }
      if (filter.category) {
        results = results.filter((r) => r.insights.category === filter.category);
      }
      if (filter.actionable !== undefined) {
        results = results.filter((r) => r.insights.actionable === filter.actionable);
      }
    }

    return results;
  }

  /**
   * Get sentiment trends over time
   */
  getSentimentTrends(): SentimentTrends {
    const sentimentScores = this.history.map((r) => this.sentimentToScore(r.insights.sentiment));

    let trend: 'improving' | 'declining' | 'stable' = 'stable';

    if (sentimentScores.length >= 3) {
      const midpoint = Math.floor(sentimentScores.length / 2);
      const firstHalf = sentimentScores.slice(0, midpoint);
      const secondHalf = sentimentScores.slice(midpoint);

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      if (secondAvg > firstAvg + 0.3) {
        trend = 'improving';
      } else if (secondAvg < firstAvg - 0.3) {
        trend = 'declining';
      }
    }

    return {
      trend,
      sentimentScores,
    };
  }

  /**
   * Get learning insights from feedback
   */
  getLearningInsights(): LearningInsights {
    const patterns = this.detectPatterns();
    const actionable = this.history.filter((r) => r.insights.actionable);

    // Count categories
    const categoryCounts = new Map<FeedbackCategory, number>();
    this.history.forEach((r) => {
      const count = categoryCounts.get(r.insights.category) || 0;
      categoryCounts.set(r.insights.category, count + 1);
    });

    // Find most common
    let mostCommon: FeedbackCategory = 'question';
    let maxCount = 0;
    categoryCounts.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = category;
      }
    });

    return {
      topIssues: patterns.slice(0, 3).map((p) => p.theme),
      actionableCount: actionable.length,
      mostCommonCategory: mostCommon,
    };
  }

  /**
   * Get feedback statistics
   */
  getStatistics(): FeedbackStatistics {
    const sentimentBreakdown: Record<Sentiment, number> = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    const categoryBreakdown: Record<FeedbackCategory, number> = {
      bug: 0,
      feature: 0,
      improvement: 0,
      praise: 0,
      question: 0,
    };

    this.history.forEach((record) => {
      sentimentBreakdown[record.insights.sentiment]++;
      categoryBreakdown[record.insights.category]++;
    });

    return {
      totalFeedback: this.history.length,
      sentimentBreakdown,
      categoryBreakdown,
    };
  }

  /**
   * Analyze sentiment of feedback message
   */
  private analyzeSentiment(message: string): Sentiment {
    const lower = message.toLowerCase();

    const positiveKeywords = [
      'great',
      'excellent',
      'good',
      'love',
      'perfect',
      'amazing',
      'wonderful',
      'fantastic',
      'impressed',
    ];

    const negativeKeywords = [
      'terrible',
      'awful',
      'broken',
      'bad',
      'disappointed',
      'hate',
      'worst',
      'poor',
      'fail',
    ];

    const positiveCount = positiveKeywords.filter((kw) => lower.includes(kw)).length;
    const negativeCount = negativeKeywords.filter((kw) => lower.includes(kw)).length;

    if (positiveCount > negativeCount) {
      return 'positive';
    } else if (negativeCount > positiveCount) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  /**
   * Categorize feedback
   */
  private categorize(message: string): FeedbackCategory {
    const lower = message.toLowerCase();

    if (lower.includes('bug') || lower.includes('error') || lower.includes('crash') || lower.includes('broken')) {
      return 'bug';
    }

    if (lower.includes('feature') || lower.includes('add') || lower.includes('support')) {
      return 'feature';
    }

    if (lower.includes('improve') || lower.includes('better') || lower.includes('could') || lower.includes('should')) {
      return 'improvement';
    }

    if (lower.includes('great') || lower.includes('excellent') || lower.includes('thank')) {
      return 'praise';
    }

    return 'question';
  }

  /**
   * Determine if feedback is actionable
   */
  private isActionable(category: FeedbackCategory, sentiment: Sentiment): boolean {
    // Bugs are always actionable
    if (category === 'bug') {
      return true;
    }

    // Feature requests and improvements are actionable
    if (category === 'feature' || category === 'improvement') {
      return true;
    }

    // Negative feedback is actionable
    if (sentiment === 'negative') {
      return true;
    }

    return false;
  }

  /**
   * Generate recommendations based on feedback
   */
  private generateRecommendations(message: string, category: FeedbackCategory): string[] {
    const recommendations: string[] = [];
    const lower = message.toLowerCase();

    if (category === 'bug') {
      recommendations.push('Investigate and fix reported bug');
      recommendations.push('Add test coverage to prevent regression');
    }

    if (category === 'feature') {
      recommendations.push('Evaluate feature request for roadmap inclusion');
    }

    if (category === 'improvement') {
      recommendations.push('Consider improvement suggestion for next iteration');
    }

    if (lower.includes('slow') || lower.includes('performance')) {
      recommendations.push('Optimize performance in identified areas');
    }

    if (lower.includes('confusing') || lower.includes('unclear')) {
      recommendations.push('Improve documentation and user guidance');
    }

    return recommendations;
  }

  /**
   * Convert sentiment to numeric score
   */
  private sentimentToScore(sentiment: Sentiment): number {
    switch (sentiment) {
      case 'positive':
        return 1.0;
      case 'neutral':
        return 0.5;
      case 'negative':
        return 0.0;
    }
  }
}
