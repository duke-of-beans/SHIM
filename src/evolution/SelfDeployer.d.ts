/**
 * SelfDeployer
 *
 * Safely test, validate, and deploy self-generated code modifications.
 * Provides staged deployment with rollback support.
 *
 * Part of Phase 6: Self-Evolution Engine
 * Component 4/4 (FINAL)
 */
import { CodeModification } from './CodeGenerator';
export type DeploymentStatus = 'pending' | 'running' | 'success' | 'failed';
export interface DeploymentStage {
    name: string;
    description: string;
    required: boolean;
}
export interface DeploymentPlan {
    id: string;
    modifications: CodeModification[];
    stages: DeploymentStage[];
    createdAt: Date;
}
export interface DeploymentResult {
    deploymentId: string;
    status: DeploymentStatus;
    stagesCompleted: string[];
    error?: string;
    startedAt: Date;
    completedAt?: Date;
}
export interface TestResult {
    passed: number;
    failed: number;
    total: number;
}
export interface SelfDeployerConfig {
    requireApproval?: boolean;
    maxConcurrentDeployments?: number;
}
export declare class SelfDeployer {
    private config;
    private deploymentCounter;
    private deploymentHistory;
    private rollbackHistory;
    constructor(config?: SelfDeployerConfig);
    /**
     * Create deployment plan from modifications
     */
    createDeploymentPlan(modifications: CodeModification[]): DeploymentPlan;
    /**
     * Execute deployment plan
     */
    executePlan(plan: DeploymentPlan): Promise<DeploymentResult>;
    /**
     * Validate modifications before deployment
     */
    validateModifications(modifications: CodeModification[]): Promise<boolean>;
    /**
     * Run tests
     */
    runTests(): Promise<TestResult>;
    /**
     * Rollback deployment
     */
    rollback(deploymentId: string): Promise<boolean>;
    /**
     * Get rollback history
     */
    getRollbackHistory(): string[];
    /**
     * Deploy modifications incrementally
     */
    deployIncrementally(modifications: CodeModification[]): Promise<DeploymentResult[]>;
    /**
     * Get deployment history
     */
    getDeploymentHistory(): DeploymentResult[];
    /**
     * Check if plan requires approval
     */
    requiresApproval(plan: DeploymentPlan): boolean;
    /**
     * Check if modifications are destructive
     */
    isDestructive(modifications: CodeModification[]): boolean;
    /**
     * Create deployment stages
     */
    private createStages;
    /**
     * Execute a single stage
     */
    private executeStage;
    /**
     * Check for syntax errors
     */
    private hasSyntaxError;
    /**
     * Generate unique deployment ID
     */
    private generateDeploymentId;
}
//# sourceMappingURL=SelfDeployer.d.ts.map