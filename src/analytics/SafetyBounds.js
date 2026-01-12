/**
 * SafetyBounds - Safety enforcement for automated experimentation
 *
 * Purpose: Prevent regressions by enforcing quality/performance/cost bounds.
 *
 * Responsibilities:
 * - Define safety thresholds (crash rate, performance, quality, cost)
 * - Validate metrics against bounds
 * - Classify violation severity (warning vs critical)
 * - Recommend rollback on critical violations
 * - Monitor bounds in real-time
 * - Generate violation reports
 *
 * Integration:
 * 1. SafetyBounds validates experiments before deployment
 * 2. Monitors metrics during experiments
 * 3. Triggers rollback on critical violations
 * 4. Prevents unsafe auto-deployments
 */
import { EventEmitter } from 'events';
export class SafetyBounds extends EventEmitter {
    config;
    baseline = {};
    constructor(config) {
        super();
        this.config = config;
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update bound threshold
     */
    updateBound(boundType, config) {
        this.config[boundType] = config;
    }
    /**
     * Remove bound
     */
    removeBound(boundType) {
        delete this.config[boundType];
    }
    /**
     * Set baseline metrics for comparison
     */
    setBaseline(baseline) {
        this.baseline = { ...baseline };
    }
    /**
     * Validate current metrics against bounds
     */
    async validate(metrics) {
        const violations = [];
        // Check crash rate
        if (this.config.crashRate) {
            const accuracy = await metrics.getMetricValue('shim_crash_prediction_accuracy');
            if (accuracy !== undefined) {
                const crashRate = 1 - accuracy;
                const violation = this.checkBound('crashRate', crashRate, this.config.crashRate);
                if (violation) {
                    violations.push(violation);
                    this.emit('violation', violation);
                    if (violation.severity === 'critical') {
                        this.emit('critical_violation', violation);
                    }
                }
            }
        }
        // Check checkpoint time
        if (this.config.checkpointTime) {
            const stats = await metrics.getHistogramStats('shim_checkpoint_creation_time');
            if (stats.count > 0) {
                const avgTime = stats.sum / stats.count;
                const violation = this.checkBound('checkpointTime', avgTime, this.config.checkpointTime);
                if (violation) {
                    violations.push(violation);
                    this.emit('violation', violation);
                    if (violation.severity === 'critical') {
                        this.emit('critical_violation', violation);
                    }
                }
            }
        }
        // Check resume success rate
        if (this.config.resumeSuccessRate) {
            const rate = await metrics.getMetricValue('shim_resume_success_rate');
            if (rate !== undefined) {
                const violation = this.checkBound('resumeSuccessRate', rate, this.config.resumeSuccessRate);
                if (violation) {
                    violations.push(violation);
                    this.emit('violation', violation);
                    if (violation.severity === 'critical') {
                        this.emit('critical_violation', violation);
                    }
                }
            }
        }
        // Check restart time
        if (this.config.restartTime) {
            const stats = await metrics.getHistogramStats('shim_supervisor_restart_time');
            if (stats.count > 0) {
                const avgTime = stats.sum / stats.count;
                const violation = this.checkBound('restartTime', avgTime, this.config.restartTime);
                if (violation) {
                    violations.push(violation);
                    this.emit('violation', violation);
                }
            }
        }
        // Determine if rollback needed
        const criticalViolations = violations.filter(v => v.severity === 'critical');
        const shouldRollback = criticalViolations.length > 0 || violations.length >= 2;
        const result = {
            passed: violations.length === 0,
            violations,
            shouldRollback,
            rollbackReason: shouldRollback
                ? this.generateRollbackReason(violations)
                : undefined
        };
        if (shouldRollback) {
            this.emit('rollback_recommended', result);
        }
        return result;
    }
    /**
     * Validate experiment against bounds
     */
    async validateExperiment(experiment, metrics) {
        const result = await this.validate(metrics);
        // Add experiment context to violations
        result.violations.forEach(violation => {
            violation.experimentId = experiment.id;
        });
        return result;
    }
    /**
     * Validate token cost increase
     */
    async validateTokenCostIncrease(baseline, current) {
        const violations = [];
        if (this.config.tokenCost?.maxIncrease !== undefined) {
            const increase = (current - baseline) / baseline;
            if (increase > this.config.tokenCost.maxIncrease) {
                violations.push({
                    boundType: 'tokenCost',
                    currentValue: increase,
                    threshold: this.config.tokenCost.maxIncrease,
                    severity: increase > this.config.tokenCost.maxIncrease * 1.5 ? 'critical' : 'warning',
                    message: `Token cost increase ${(increase * 100).toFixed(1)}% exceeds limit ${(this.config.tokenCost.maxIncrease * 100).toFixed(1)}%`,
                    detectedAt: new Date().toISOString()
                });
            }
        }
        return {
            passed: violations.length === 0,
            violations,
            shouldRollback: violations.some(v => v.severity === 'critical')
        };
    }
    /**
     * Validate against baseline metrics
     */
    async validateAgainstBaseline(metrics) {
        const violations = [];
        // Check crash rate against baseline
        if (this.baseline.crashRate !== undefined) {
            const accuracy = await metrics.getMetricValue('shim_crash_prediction_accuracy');
            if (accuracy !== undefined) {
                const crashRate = 1 - accuracy;
                if (crashRate > this.baseline.crashRate) {
                    violations.push({
                        boundType: 'crashRate',
                        currentValue: crashRate,
                        threshold: this.baseline.crashRate,
                        severity: crashRate > this.baseline.crashRate * 1.5 ? 'critical' : 'warning',
                        message: `Crash rate ${(crashRate * 100).toFixed(1)}% exceeds baseline ${(this.baseline.crashRate * 100).toFixed(1)}%`,
                        detectedAt: new Date().toISOString()
                    });
                }
            }
        }
        // Check checkpoint time against baseline
        if (this.baseline.checkpointTime !== undefined) {
            const stats = await metrics.getHistogramStats('shim_checkpoint_creation_time');
            if (stats.count > 0) {
                const avgTime = stats.sum / stats.count;
                if (avgTime > this.baseline.checkpointTime) {
                    violations.push({
                        boundType: 'checkpointTime',
                        currentValue: avgTime,
                        threshold: this.baseline.checkpointTime,
                        severity: avgTime > this.baseline.checkpointTime * 1.5 ? 'critical' : 'warning',
                        message: `Checkpoint time ${avgTime.toFixed(1)}ms exceeds baseline ${this.baseline.checkpointTime.toFixed(1)}ms`,
                        detectedAt: new Date().toISOString()
                    });
                }
            }
        }
        return {
            passed: violations.length === 0,
            violations,
            shouldRollback: violations.some(v => v.severity === 'critical')
        };
    }
    /**
     * Check individual bound
     */
    checkBound(type, value, bound) {
        // Check maximum bound
        if (bound.max !== undefined && value > bound.max) {
            const severity = bound.critical !== undefined && value > bound.critical
                ? 'critical'
                : 'warning';
            return {
                boundType: type,
                currentValue: value,
                threshold: bound.max,
                severity,
                message: this.generateViolationMessage(type, value, bound.max, 'exceeds'),
                detectedAt: new Date().toISOString()
            };
        }
        // Check minimum bound
        if (bound.min !== undefined && value < bound.min) {
            const severity = bound.critical !== undefined && value < bound.critical
                ? 'critical'
                : 'warning';
            return {
                boundType: type,
                currentValue: value,
                threshold: bound.min,
                severity,
                message: this.generateViolationMessage(type, value, bound.min, 'below'),
                detectedAt: new Date().toISOString()
            };
        }
        return null;
    }
    /**
     * Generate violation message
     */
    generateViolationMessage(type, value, threshold, direction) {
        const formattedValue = this.formatValue(type, value);
        const formattedThreshold = this.formatValue(type, threshold);
        return `${type} ${formattedValue} ${direction} threshold ${formattedThreshold}`;
    }
    /**
     * Format value for display
     */
    formatValue(type, value) {
        if (type.includes('Rate') || type.includes('Success')) {
            return `${(value * 100).toFixed(1)}%`;
        }
        if (type.includes('Time')) {
            return `${value.toFixed(1)}ms`;
        }
        return value.toFixed(2);
    }
    /**
     * Generate rollback reason
     */
    generateRollbackReason(violations) {
        const critical = violations.filter(v => v.severity === 'critical');
        if (critical.length > 0) {
            return `Critical violations: ${critical.map(v => v.boundType).join(', ')}`;
        }
        return `Multiple violations detected: ${violations.map(v => v.boundType).join(', ')}`;
    }
    /**
     * Generate violation report
     */
    generateReport(result) {
        if (result.passed) {
            return 'All safety bounds satisfied';
        }
        let report = `Safety Violations Detected (${result.violations.length}):\n\n`;
        result.violations.forEach((violation, i) => {
            report += `${i + 1}. [${violation.severity.toUpperCase()}] ${violation.message}\n`;
            report += `   Type: ${violation.boundType}\n`;
            report += `   Current: ${violation.currentValue.toFixed(3)}\n`;
            report += `   Threshold: ${violation.threshold.toFixed(3)}\n`;
            // Add suggestion
            const suggestion = this.getSuggestion(violation.boundType);
            if (suggestion) {
                report += `   Suggestion: ${suggestion}\n`;
            }
            report += '\n';
        });
        if (result.shouldRollback) {
            report += `⚠️  ROLLBACK RECOMMENDED: ${result.rollbackReason}\n`;
        }
        return report;
    }
    /**
     * Get remediation suggestion
     */
    getSuggestion(boundType) {
        const suggestions = {
            'crashRate': 'Consider reducing checkpoint interval or improving crash detection',
            'checkpointTime': 'Try async compression or incremental checkpointing',
            'resumeSuccessRate': 'Enhance state capture or add validation',
            'tokenCost': 'Route simple queries to smaller models',
            'restartTime': 'Enable parallel initialization or cache state'
        };
        return suggestions[boundType] || null;
    }
}
//# sourceMappingURL=SafetyBounds.js.map