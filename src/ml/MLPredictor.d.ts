/**
 * MLPredictor
 * Machine learning predictor for SHIM patterns
 */
export interface TrainingData {
    features: number[][];
    labels: number[];
}
export interface PredictorConfig {
    modelType?: string;
    epochs?: number;
}
export declare class MLPredictor {
    private trained;
    private trainingProgress;
    constructor();
    train(data: TrainingData, config?: PredictorConfig): Promise<void>;
    getTrainingStatus(): {
        progress: number;
        trained: boolean;
    };
    evaluate(testData: TrainingData): Promise<{
        accuracy: number;
        metrics: any;
    }>;
}
//# sourceMappingURL=MLPredictor.d.ts.map