import type { FlowResult, ReporterOptions, StepResult } from "@restflow/types";

/**
 * Base reporter interface for flow execution reporting
 */
export interface Reporter {
	onFlowStart(flowName: string): void;
	onStepStart(stepName: string, stepIndex: number, totalSteps: number): void;
	onStepComplete(result: StepResult): void;
	onFlowComplete(result: FlowResult): void;
}

/**
 * Extended reporter options with additional features
 */
export interface ExtendedReporterOptions extends ReporterOptions {
	colors?: boolean;
	showProgress?: boolean;
	showTimings?: boolean;
}
