import type { FlowResult, StepResult } from "@restflow/types";
import type { Reporter, ExtendedReporterOptions } from "./base-reporter.js";

/**
 * JSON reporter for machine-readable output
 */
export class JSONReporter implements Reporter {
	private options: ExtendedReporterOptions;
	private flowData: any = null;

	constructor(options: ExtendedReporterOptions = {}) {
		this.options = {
			verbose: false,
			showHeaders: false,
			showBody: false,
			format: "json",
			...options,
		};
	}

	onFlowStart(flowName: string): void {
		this.flowData = {
			flowName,
			startTime: Date.now(),
			steps: [],
		};

		// In verbose mode, output events as they happen
		if (this.options.verbose) {
			this.outputEvent("flow_started", { flowName });
		}
	}

	onStepStart(stepName: string, stepIndex: number, totalSteps: number): void {
		if (this.options.verbose) {
			this.outputEvent("step_started", { 
				stepName, 
				stepIndex, 
				totalSteps 
			});
		}
	}

	onStepComplete(result: StepResult): void {
		if (this.flowData) {
			const stepData = {
				name: result.step.name,
				method: result.step.request.method,
				url: result.step.request.url,
				status: result.response?.status,
				duration: result.duration,
				success: !result.error,
				error: result.error?.message,
				directives: result.directives.map(d => ({
					type: d.directive.type,
					success: d.success,
					error: d.error,
				})),
			};

			// Add optional fields based on options
			if (this.options.showHeaders && result.response?.headers) {
				(stepData as any).headers = result.response.headers;
			}

			if (this.options.showBody && result.response?.body) {
				(stepData as any).responseBody = this.parseBodySafely(result.response.body);
			}

			if (this.options.showBody && result.step.request.body) {
				(stepData as any).requestBody = this.parseBodySafely(result.step.request.body);
			}

			this.flowData.steps.push(stepData);

			// In verbose mode, output step completion immediately
			if (this.options.verbose) {
				this.outputEvent("step_completed", stepData);
			}
		}
	}

	onFlowComplete(result: FlowResult): void {
		const output = {
			...this.flowData,
			endTime: Date.now(),
			success: result.success,
			duration: result.duration,
			summary: {
				steps: {
					total: result.steps.length,
					passed: result.steps.filter(s => !s.error).length,
					failed: result.steps.filter(s => s.error).length,
				},
				directives: {
					total: result.steps.reduce((sum, s) => sum + s.directives.length, 0),
					passed: result.steps.reduce((sum, s) => sum + s.directives.filter(d => d.success).length, 0),
					failed: result.steps.reduce((sum, s) => sum + s.directives.filter(d => !d.success).length, 0),
				},
			},
		};

		if (this.options.verbose) {
			this.outputEvent("flow_completed", output);
		} else {
			// Non-verbose mode: output complete results
			console.log(JSON.stringify(output, null, 2));
		}
	}

	private outputEvent(eventType: string, data: any): void {
		console.log(JSON.stringify({
			event: eventType,
			timestamp: Date.now(),
			data,
		}));
	}

	private parseBodySafely(body: string): any {
		try {
			return JSON.parse(body);
		} catch {
			return body;
		}
	}
}