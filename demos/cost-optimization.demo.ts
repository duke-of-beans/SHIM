/**
 * SHIM Demonstration - Cost Optimization
 * 
 * Demonstrates intelligent model routing with automatic cost optimization.
 * 
 * Run: npx ts-node demos/cost-optimization.demo.ts
 * 
 * Shows:
 * - Automatic prompt analysis
 * - Intelligent model selection
 * - Cost estimation and savings
 * - Real-time tracking
 * - Monthly projections
 */

import { PromptAnalyzer } from '../src/models/PromptAnalyzer';
import { ModelRouter } from '../src/models/ModelRouter';
import { TokenEstimator } from '../src/models/TokenEstimator';

// Real-world queries
const QUERIES = [
  "What is TypeScript?",
  "Define async/await",
  "Explain how React hooks work with examples",
  "Compare microservices vs monolithic architecture",
  "Implement a self-balancing AVL tree in TypeScript with rotations"
];

async function demo() {
  console.log('🎯 SHIM Cost Optimization Demo\n');
  
  const analyzer = new PromptAnalyzer();
  const router = new ModelRouter({ analyzer, costOptimization: true });
  const estimator = new TokenEstimator();
  
  for (const query of QUERIES) {
    const decision = await router.route(query);
    
    console.log(`Query: "${query}"`);
    console.log(`Model: ${decision.selectedModel.toUpperCase()}`);
    console.log(`Cost: $${decision.estimatedCost[decision.selectedModel].toFixed(6)}`);
    console.log(`Saved: $${decision.costSavings.toFixed(6)}`);
    console.log();
    
    const tokens = analyzer.analyze(query).estimatedTokens;
    estimator.trackUsage({
      model: decision.selectedModel,
      inputTokens: tokens,
      outputTokens: tokens,
      totalCost: decision.estimatedCost[decision.selectedModel]
    });
    
    estimator.trackSavings({
      actualModel: decision.selectedModel,
      alternativeModel: 'opus',
      tokens: tokens * 2,
      savedCost: decision.costSavings
    });
  }
  
  const report = estimator.getCostReport();
  
  console.log('═'.repeat(60));
  console.log('RESULTS:');
  console.log(`Total Cost: $${report.totalCost.toFixed(4)}`);
  console.log(`Total Savings: $${report.totalSavings.toFixed(4)}`);
  console.log(`Savings: ${report.savingsPercentage.toFixed(1)}%`);
  console.log('═'.repeat(60));
}

demo().catch(console.error);
