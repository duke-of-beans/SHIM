"use strict";
/**
 * SHIM Activation Script
 *
 * This script demonstrates how to activate and use SHIM's self-evolution capabilities.
 * Run this to see SHIM autonomously improve your code!
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSelfEvolution = runSelfEvolution;
const CodeAnalyzer_1 = require("./evolution/CodeAnalyzer");
const ImprovementIdentifier_1 = require("./evolution/ImprovementIdentifier");
const CodeGenerator_1 = require("./evolution/CodeGenerator");
const SelfDeployer_1 = require("./evolution/SelfDeployer");
const ASTAnalyzer_1 = require("./evolution/ASTAnalyzer");
const PatternLearner_1 = require("./ml/PatternLearner");
const EvolutionMonitor_1 = require("./monitoring/EvolutionMonitor");
const PerformanceCache_1 = require("./performance/PerformanceCache");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function runSelfEvolution(targetDirectory) {
    console.log('🚀 SHIM Self-Evolution Engine - ACTIVATED\n');
    // Initialize all components
    const analyzer = new CodeAnalyzer_1.CodeAnalyzer();
    const identifier = new ImprovementIdentifier_1.ImprovementIdentifier();
    const generator = new CodeGenerator_1.CodeGenerator();
    const deployer = new SelfDeployer_1.SelfDeployer({ requireApproval: true }); // Safe mode!
    const astAnalyzer = new ASTAnalyzer_1.ASTAnalyzer();
    const patternLearner = new PatternLearner_1.PatternLearner();
    const monitor = new EvolutionMonitor_1.EvolutionMonitor();
    const cache = new PerformanceCache_1.PerformanceCache(1000, 300000); // 5 min TTL
    console.log('✅ All components initialized');
    console.log(`📁 Target directory: ${targetDirectory}\n`);
    // STEP 1: ANALYZE
    console.log('🔍 STEP 1: Analyzing codebase...');
    const startAnalysis = Date.now();
    const analysis = await analyzer.analyzeDirectory(targetDirectory);
    console.log(`   Files analyzed: ${analysis.totalFiles}`);
    console.log(`   Total LOC: ${analysis.totalLinesOfCode}`);
    console.log(`   Average complexity: ${analysis.averageComplexity.toFixed(2)}`);
    console.log(`   Analysis time: ${Date.now() - startAnalysis}ms\n`);
    // Convert to AnalysisReport format
    const analysisReport = {
        summary: {
            totalFiles: analysis.totalFiles,
            totalLOC: analysis.totalLinesOfCode,
            averageComplexity: analysis.averageComplexity,
            maintainabilityScore: 0,
        },
        metrics: analysis.fileMetrics,
        issues: analysis.fileMetrics.flatMap((file) => (file.codeSmells || []).map((smell) => ({
            severity: smell.severity,
            type: smell.type,
            file: file.path,
            description: smell.description,
        }))),
        recommendations: [],
    };
    // STEP 2: IDENTIFY IMPROVEMENTS
    console.log('💡 STEP 2: Identifying improvement opportunities...');
    const improvements = identifier.identifyImprovements(analysisReport);
    console.log(`   Opportunities found: ${improvements.length}`);
    if (improvements.length === 0) {
        console.log('\n✨ No improvements needed - codebase is already excellent!\n');
        return;
    }
    const topImprovements = identifier.rankByPriority(improvements).slice(0, 5);
    console.log('   Top opportunities:');
    topImprovements.forEach((imp, i) => {
        const roi = imp.roi !== undefined ? imp.roi.toFixed(2) : 'N/A';
        console.log(`   ${i + 1}. [${imp.priority.toUpperCase()}] ${imp.description} (ROI: ${roi})`);
    });
    console.log();
    // STEP 3: GENERATE MODIFICATIONS
    console.log('🔧 STEP 3: Generating code modifications...');
    const modifications = generator.generateModifications(topImprovements[0]);
    console.log(`   Modifications generated: ${modifications.length}`);
    modifications.forEach((mod, i) => {
        console.log(`   ${i + 1}. ${mod.type} in ${mod.filePath}`);
    });
    console.log();
    // STEP 4: CREATE DEPLOYMENT PLAN
    console.log('📋 STEP 4: Creating deployment plan...');
    const plan = deployer.createDeploymentPlan(modifications);
    console.log(`   Deployment ID: ${plan.id}`);
    console.log(`   Stages: ${plan.stages.map((s) => s.name).join(' → ')}`);
    console.log(`   Modifications: ${plan.modifications.length}`);
    console.log();
    // STEP 5: USER APPROVAL (Safe mode!)
    console.log('⚠️  STEP 5: Deployment ready - APPROVAL REQUIRED');
    console.log('\n📝 Preview of changes:');
    modifications.forEach((mod, i) => {
        console.log(`\n--- Modification ${i + 1} ---`);
        console.log(`File: ${mod.filePath}`);
        console.log(`Type: ${mod.type}`);
        console.log(`Description: ${mod.description}`);
        console.log('\nDiff:');
        console.log(mod.diff);
    });
    console.log('\n⏸️  Deployment paused - awaiting manual approval');
    console.log('   To deploy: Set requireApproval: false in SelfDeployer config');
    console.log('   To skip: Review modifications above and apply manually\n');
    // STEP 6: MONITORING & REPORTING
    console.log('📊 STEP 6: Recording metrics...');
    const metrics = {
        timestamp: new Date(),
        totalImprovements: improvements.length,
        successfulDeployments: 0,
        failedDeployments: 0,
        averageComplexityReduction: 0,
        averageMaintainabilityIncrease: 0,
        totalLinesRefactored: modifications.reduce((sum, m) => sum + 1, 0),
    };
    monitor.recordMetrics(metrics);
    const snapshot = monitor.getCurrentSnapshot();
    console.log(`   Current metrics recorded`);
    console.log(`   Improvement velocity: ${snapshot.trend.velocity.toFixed(2)}/hour\n`);
    // STEP 7: GENERATE REPORT
    console.log('📄 Generating evolution report...\n');
    const report = monitor.exportReport();
    console.log(report);
    console.log('\n✅ Self-evolution cycle complete!\n');
    console.log('🎯 Next steps:');
    console.log('   1. Review proposed modifications above');
    console.log('   2. Test manually or enable auto-deployment');
    console.log('   3. Monitor metrics in evolution report');
    console.log('   4. Run again to continue improving!\n');
}
// CLI entry point
if (require.main === module) {
    const targetDir = process.argv[2] || './src';
    if (!fs.existsSync(targetDir)) {
        console.error(`❌ Error: Directory not found: ${targetDir}`);
        process.exit(1);
    }
    runSelfEvolution(path.resolve(targetDir))
        .then(() => {
        console.log('🎊 SHIM self-evolution completed successfully!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Self-evolution failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=activate.js.map