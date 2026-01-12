/**
 * ResultAggregator
 *
 * Aggregate and merge results from distributed tasks.
 * Part of Phase 4: Multi-Chat Coordination
 */
export class ResultAggregator {
    results;
    constructor() {
        this.results = new Map();
    }
    addResult(result) {
        this.results.set(result.taskId, result);
    }
    getResult(taskId) {
        return this.results.get(taskId) || null;
    }
    getAllResults() {
        return Array.from(this.results.values());
    }
    getResultsByGroup(groupId) {
        return this.getAllResults().filter((r) => r.groupId === groupId);
    }
    mergeResults(groupId) {
        const groupResults = this.getResultsByGroup(groupId);
        const merged = {};
        groupResults.forEach((result) => {
            if (result.status === 'success') {
                Object.assign(merged, result.data);
            }
        });
        return merged;
    }
    isGroupComplete(taskIds) {
        return taskIds.every((id) => this.results.has(id));
    }
    getProgress(taskIds) {
        const completed = taskIds.filter((id) => this.results.has(id)).length;
        return completed / taskIds.length;
    }
    getFailedResults() {
        return this.getAllResults().filter((r) => r.status === 'failed');
    }
    getSuccessfulResults() {
        return this.getAllResults().filter((r) => r.status === 'success');
    }
    getStatistics() {
        const all = this.getAllResults();
        const successful = this.getSuccessfulResults().length;
        const failed = this.getFailedResults().length;
        return {
            total: all.length,
            successful,
            failed,
            successRate: all.length > 0 ? successful / all.length : 0,
        };
    }
}
//# sourceMappingURL=ResultAggregator.js.map