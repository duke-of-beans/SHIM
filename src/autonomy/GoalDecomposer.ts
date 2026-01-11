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
  priority: 1 | 2 | 3;  // 1=high, 2=medium, 3=low
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
  dependencies?: string[];  // IDs of sub-goals that must complete first
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
export class GoalDecomposer {
  /**
   * Decompose a high-level goal into sub-goals
   */
  async decompose(goal: Goal): Promise<GoalDecomposition> {
    // Validate goal
    if (!goal.id || !goal.description) {
      throw new Error('Invalid goal: id and description required');
    }
    
    // Generate sub-goals based on goal type and complexity
    const subGoals = this.generateSubGoals(goal);
    
    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(subGoals);
    
    // Calculate total effort
    const totalEstimatedHours = subGoals.reduce((sum, sg) => sum + sg.estimatedHours, 0);
    
    // Apply constraints if present
    const constrainedSubGoals = goal.constraints?.maxHours
      ? this.applyHoursConstraint(subGoals, goal.constraints.maxHours)
      : subGoals;
    
    const constrainedTotal = constrainedSubGoals.reduce((sum, sg) => sum + sg.estimatedHours, 0);
    
    return {
      goalId: goal.id,
      goalType: goal.type,
      subGoals: constrainedSubGoals,
      dependencyGraph,
      totalEstimatedHours: constrainedTotal,
      constraints: goal.constraints
    };
  }
  
  /**
   * Generate sub-goals based on goal characteristics
   */
  private generateSubGoals(goal: Goal): SubGoal[] {
    const complexity = this.assessComplexity(goal.description);
    const subGoals: SubGoal[] = [];
    
    // Base sub-goals based on goal type
    const templates = this.getTypeTemplates(goal.type);
    
    // Scale templates based on complexity
    const scaledTemplates = this.scaleTemplates(templates, complexity);
    
    // Create sub-goals
    scaledTemplates.forEach((template, index) => {
      subGoals.push({
        id: `${goal.id}-sub-${index + 1}`,
        description: template.description,
        priority: this.calculateSubGoalPriority(goal.priority, index, scaledTemplates.length),
        estimatedHours: template.hours,
        successCriteria: template.criteria
      });
    });
    
    // Add dependencies
    this.addDependencies(subGoals, goal.type);
    
    return subGoals;
  }
  
  /**
   * Assess goal complexity (1-10 scale)
   */
  private assessComplexity(description: string): number {
    const indicators = {
      simple: ['fix', 'update', 'small', 'simple', 'quick'],
      medium: ['implement', 'add', 'create', 'build'],
      complex: ['system', 'architecture', 'complete', 'comprehensive', 'multiple', 'oauth', '2fa', 'session']
    };
    
    const lower = description.toLowerCase();
    
    // Count complexity indicators
    let score = 3; // Base complexity
    
    if (indicators.simple.some(word => lower.includes(word))) score -= 1;
    if (indicators.complex.some(word => lower.includes(word))) score += 4;
    
    // Length indicator
    if (description.length > 100) score += 2;
    if (description.length < 30) score -= 1;
    
    // Word count indicator
    const words = description.split(/\s+/).length;
    if (words > 15) score += 2;
    if (words < 5) score -= 1;
    
    return Math.max(1, Math.min(10, score));
  }
  
  /**
   * Get sub-goal templates for goal type
   */
  private getTypeTemplates(type: GoalType): Array<{ description: string; hours: number; criteria: string[] }> {
    const templates: Record<GoalType, Array<{ description: string; hours: number; criteria: string[] }>> = {
      development: [
        { description: 'Design architecture', hours: 2, criteria: ['Architecture documented', 'Review completed'] },
        { description: 'Set up development environment', hours: 1, criteria: ['Environment ready'] },
        { description: 'Implement core functionality', hours: 8, criteria: ['Core features working', 'Tests passing'] },
        { description: 'Implement additional features', hours: 4, criteria: ['All features complete'] },
        { description: 'Write tests', hours: 4, criteria: ['Coverage >80%', 'All tests passing'] },
        { description: 'Code review', hours: 2, criteria: ['Review approved', 'Issues addressed'] }
      ],
      testing: [
        { description: 'Plan test strategy', hours: 1, criteria: ['Strategy documented'] },
        { description: 'Write unit tests', hours: 4, criteria: ['Unit coverage >80%'] },
        { description: 'Write integration tests', hours: 3, criteria: ['Critical paths tested'] },
        { description: 'Verify coverage', hours: 1, criteria: ['Coverage goals met'] }
      ],
      documentation: [
        { description: 'Outline structure', hours: 0.5, criteria: ['Outline complete'] },
        { description: 'Write content', hours: 2, criteria: ['All sections complete'] },
        { description: 'Review and edit', hours: 1, criteria: ['Review completed'] }
      ],
      deployment: [
        { description: 'Prepare environment', hours: 2, criteria: ['Environment ready'] },
        { description: 'Deploy application', hours: 3, criteria: ['Deployment successful'] },
        { description: 'Verify functionality', hours: 1, criteria: ['Health checks passing'] },
        { description: 'Monitor stability', hours: 2, criteria: ['No errors for 1 hour'] }
      ],
      optimization: [
        { description: 'Profile performance', hours: 2, criteria: ['Bottlenecks identified'] },
        { description: 'Implement optimizations', hours: 4, criteria: ['Improvements verified'] },
        { description: 'Benchmark results', hours: 1, criteria: ['Performance improved'] }
      ],
      quality: [
        { description: 'Audit code quality', hours: 2, criteria: ['Issues documented'] },
        { description: 'Fix issues', hours: 4, criteria: ['All issues resolved'] },
        { description: 'Verify improvements', hours: 1, criteria: ['Quality metrics improved'] }
      ],
      workflow: [
        { description: 'Define workflow steps', hours: 1, criteria: ['Steps documented'] },
        { description: 'Implement workflow', hours: 4, criteria: ['Workflow functional'] },
        { description: 'Test workflow', hours: 2, criteria: ['All paths tested'] }
      ],
      process: [
        { description: 'Document process', hours: 2, criteria: ['Process documented'] },
        { description: 'Execute process', hours: 4, criteria: ['Process complete'] },
        { description: 'Verify outcomes', hours: 1, criteria: ['Success criteria met'] }
      ]
    };
    
    return templates[type] || templates.development;
  }
  
  /**
   * Scale templates based on complexity
   */
  private scaleTemplates(
    templates: Array<{ description: string; hours: number; criteria: string[] }>,
    complexity: number
  ): Array<{ description: string; hours: number; criteria: string[] }> {
    const multiplier = complexity / 5; // Normalize to 0.2-2.0 range
    
    return templates.map(template => ({
      ...template,
      hours: Math.max(0.5, template.hours * multiplier)
    }));
  }
  
  /**
   * Calculate sub-goal priority
   */
  private calculateSubGoalPriority(goalPriority: 1 | 2 | 3, index: number, total: number): 1 | 2 | 3 {
    // Earlier sub-goals inherit goal priority
    // Later sub-goals may be lower priority
    if (index < total * 0.3) return goalPriority;
    if (index < total * 0.7) return Math.min(3, goalPriority + 1) as 1 | 2 | 3;
    return 3;
  }
  
  /**
   * Add dependencies based on goal type
   */
  private addDependencies(subGoals: SubGoal[], type: GoalType): void {
    // Sequential dependencies for most types
    if (['development', 'deployment', 'workflow', 'process'].includes(type)) {
      for (let i = 1; i < subGoals.length; i++) {
        subGoals[i]!.dependencies = [subGoals[i - 1]!.id];
      }
    }
    
    // Parallel for testing and documentation (no dependencies)
    // Quality and optimization have custom dependencies
    if (type === 'quality' || type === 'optimization') {
      // Last sub-goal depends on all others
      const lastIndex = subGoals.length - 1;
      subGoals[lastIndex]!.dependencies = subGoals
        .slice(0, lastIndex)
        .map(sg => sg.id);
    }
  }
  
  /**
   * Build dependency graph from sub-goals
   */
  private buildDependencyGraph(subGoals: SubGoal[]): DependencyGraph {
    const graph: DependencyGraph = {};
    
    subGoals.forEach(subGoal => {
      graph[subGoal.id] = subGoal.dependencies || [];
    });
    
    return graph;
  }
  
  /**
   * Apply hours constraint to sub-goals
   */
  private applyHoursConstraint(subGoals: SubGoal[], maxHours: number): SubGoal[] {
    const total = subGoals.reduce((sum, sg) => sum + sg.estimatedHours, 0);
    
    if (total <= maxHours) return subGoals;
    
    // Scale all sub-goals proportionally
    const ratio = maxHours / total;
    return subGoals.map(sg => ({
      ...sg,
      estimatedHours: Math.max(0.5, sg.estimatedHours * ratio)
    }));
  }
  
  /**
   * Check for circular dependencies
   */
  hasCircularDependencies(decomposition: GoalDecomposition): boolean {
    const { dependencyGraph } = decomposition;
    const visited = new Set<string>();
    const recStack = new Set<string>();
    
    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recStack.add(node);
      
      const neighbors = dependencyGraph[node] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }
      
      recStack.delete(node);
      return false;
    };
    
    for (const node of Object.keys(dependencyGraph)) {
      if (!visited.has(node)) {
        if (hasCycle(node)) return true;
      }
    }
    
    return false;
  }
  
  /**
   * Topologically sort sub-goals by dependencies
   */
  topologicalSort(decomposition: GoalDecomposition): SubGoal[] {
    const { subGoals, dependencyGraph } = decomposition;
    const sorted: SubGoal[] = [];
    const visited = new Set<string>();
    
    const visit = (nodeId: string): void => {
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      const deps = dependencyGraph[nodeId] || [];
      deps.forEach(depId => visit(depId));
      
      const subGoal = subGoals.find(sg => sg.id === nodeId);
      if (subGoal) sorted.push(subGoal);
    };
    
    subGoals.forEach(sg => visit(sg.id));
    
    return sorted;
  }
}
