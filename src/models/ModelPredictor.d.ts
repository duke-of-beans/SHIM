/**
 * ModelPredictor
 * Makes predictions using registered models
 */
export declare class ModelPredictor {
    private modelId;
    constructor(modelId: string);
    predict(input: any): Promise<any>;
}
//# sourceMappingURL=ModelPredictor.d.ts.map