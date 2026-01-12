/**
 * ConfigManager
 * Manages SHIM configuration
 */
interface ValidationResult {
    valid: boolean;
    errors?: string[];
}
export declare class ConfigManager {
    private config;
    constructor();
    getAll(): Promise<Record<string, any>>;
    get(key: string): Promise<any>;
    update(updates: Record<string, any>): Promise<void>;
    validate(config: Record<string, any>): Promise<ValidationResult>;
    reset(): Promise<void>;
}
export {};
//# sourceMappingURL=ConfigManager.d.ts.map