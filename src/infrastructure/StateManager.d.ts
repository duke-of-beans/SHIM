/**
 * StateManager
 * Manages distributed state across SHIM components
 */
export declare class StateManager {
    private state;
    constructor();
    save(key: string, value: any): Promise<void>;
    load(key: string): Promise<any>;
    clear(key: string): Promise<void>;
    listKeys(): Promise<string[]>;
}
//# sourceMappingURL=StateManager.d.ts.map