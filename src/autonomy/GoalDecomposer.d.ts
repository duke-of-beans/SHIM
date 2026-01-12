/**
 * GoalDecomposer
 *
 * Intelligent goal decomposition into executable sub-goals.
 * Uses heuristics and domain knowledge to break down complex goals.
 *
 * Purpose: Enable autonomous operation by breaking high-level goals
 * into manageable, trackable sub-goals with clear dependencies.
 */
/**
 * Goal type categories
 */
export type GoalType = 'development' | 'testing' | 'documentation' | 'deployment' | 'optimization' | 'quality' | 'workflow' | 'process';
/**
 * Goal constraints
 */
export interface GoalConstraints {
    maxHours?: number;
    deadline?: string;
    resources?: string[];
}
/**
 * High-level goal
 */
export interface Goal {
    id: string;
    description: string;
    type: GoalType;
    priority: 1 | 2 | 3;
    constraints?: GoalConstraints;
}
/**
 * Executable sub-goal
 */
export interface SubGoal {
    id: string;
    description: string;
    priority: 1 | 2 | 3;
    estimatedHours: number;
    successCriteria: string[];
    dependencies?: string[];
}
/**
 * Dependency graph (adjacency list)
 */
export type DependencyGraph = Record<string, string[]>;
/**
 * Complete goal decomposition
 */
export interface GoalDecomposition {
    goalId: string;
    goalType: GoalType;
    subGoals: SubGoal[];
    dependencyGraph: DependencyGraph;
    totalEstimatedHours: number;
    constraints?: GoalConstraints;
}
/**
 * GoalDecomposer
 *
 * Breaks down high-level goals into executable sub-goals.
 */
export declare class GoalDecomposer {
    /**
     * Decompose a high-level goal into sub-goals
     */
    decompose(goal: Goal): Promise<GoalDecomposition>;
    /**
     * Generate sub-goals based on goal characteristics
     */
    private generateSubGoals;
    /**
     * Assess goal complexity (1-10 scale)
     */
    private assessComplexity;
    /**
     * Get sub-goal templates for goal type
     */
    private getTypeTemplates;
    /**
     * Scale templates based on complexity
     */
    private scaleTemplates;
    /**
     * Calculate sub-goal priority
     */
    private calculateSubGoalPriority;
    /**
     * Add dependencies based on goal type
     */
    private addDependencies;
    /**
     * Build dependency graph from sub-goals
     */
    private buildDependencyGraph;
    /**
     * Apply hours constraint to sub-goals
     */
    private applyHoursConstraint;
    /**
     * Check for circular dependencies
     */
    hasCircularDependencies(decomposition: GoalDecomposition): boolean;
    /**
     * Topologically sort sub-goals by dependencies
     */
    topologicalSort(decomposition: GoalDecomposition): SubGoal[];
}
//# sourceMappingURL=GoalDecomposer.d.ts.map