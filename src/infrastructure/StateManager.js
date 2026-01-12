/**
 * StateManager
 * Manages distributed state across SHIM components
 */
export class StateManager {
    state = new Map();
    constructor() { }
    async save(key, value) {
        this.state.set(key, value);
    }
    async load(key) {
        return this.state.get(key);
    }
    async clear(key) {
        this.state.delete(key);
    }
    async listKeys() {
        return Array.from(this.state.keys());
    }
}
//# sourceMappingURL=StateManager.js.map