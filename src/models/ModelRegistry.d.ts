/**
 * ModelRegistry
 * Registry for AI models used by SHIM
 */
export interface ModelInfo {
    id: string;
    name: string;
    version: string;
    type: string;
    loaded: boolean;
}
export declare class ModelRegistry {
    private models;
    constructor();
    list(): Promise<ModelInfo[]>;
    get(modelId: string): Promise<ModelInfo | undefined>;
    load(modelId: string): Promise<void>;
    unload(modelId: string): Promise<void>;
}
//# sourceMappingURL=ModelRegistry.d.ts.map