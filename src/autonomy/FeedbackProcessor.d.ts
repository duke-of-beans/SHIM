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
export declare class FeedbackProcessor {
    private history;
    constructor();
    /**
     * Process feedback and extract insights
     */
    processFeedback(feedback: Feedback): FeedbackInsights;
    /**
     * Detect recurring patterns in feedback
     */
    detectPatterns(): FeedbackPattern[];
    /**
     * Get feedback history
     */
    getFeedbackHistory(filter?: FeedbackHistoryFilter): FeedbackHistoryRecord[];
    /**
     * Get sentiment trends over time
     */
    getSentimentTrends(): SentimentTrends;
    /**
     * Get learning insights from feedback
     */
    getLearningInsights(): LearningInsights;
    /**
     * Get feedback statistics
     */
    getStatistics(): FeedbackStatistics;
    /**
     * Analyze sentiment of feedback message
     */
    private analyzeSentiment;
    /**
     * Categorize feedback
     */
    private categorize;
    /**
     * Determine if feedback is actionable
     */
    private isActionable;
    /**
     * Generate recommendations based on feedback
     */
    private generateRecommendations;
    /**
     * Convert sentiment to numeric score
     */
    private sentimentToScore;
}
//# sourceMappingURL=FeedbackProcessor.d.ts.map