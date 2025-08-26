import type { FlowResult, StepResult } from "@restflow/types";
import type { Reporter, ExtendedReporterOptions } from "./base-reporter.js";

/**
 * Summary reporter for concise test results
 */
export class SummaryReporter implements Reporter {
	private options: ExtendedReporterOptions;
	private startTime: number = 0;

	constructor(options: ExtendedReporterOptions = {}) {
		this.options = {
			verbose: false,
			showHeaders: false,
			showBody: false,
			format: "summary",
			...options,
		};
	}

	onFlowStart(flowName: string): void {
		this.startTime = Date.now();
		if (this.options.verbose) {
			console.log(`Starting ${flowName}...`);
		}
	}

	onStepStart(stepName: string, stepIndex: number, totalSteps: number): void {
		// Silent for summary mode unless verbose
		if (this.options.verbose) {
			console.log(`[${stepIndex + 1}/${totalSteps}] ${stepName}`);
		}
	}

	onStepComplete(result: StepResult): void {
		// Collect data silently, only output at the end
		if (this.options.verbose && result.error) {
			console.log(`  ❌ ${result.step.name}: ${result.error.message}`);
		}
	}

	onFlowComplete(result: FlowResult): void {
		const duration = Date.now() - this.startTime;
		const passedSteps = result.steps.filter(s => !s.error).length;
		const totalDirectives = result.steps.reduce((sum, s) => sum + s.directives.length, 0);
		const passedDirectives = result.steps.reduce((sum, s) => sum + s.directives.filter(d => d.success).length, 0);

		// Concise summary output
		const status = result.success ? "PASS" : "FAIL";
		const stepsSummary = `${passedSteps}/${result.steps.length} steps`;
		const directivesSummary = `${passedDirectives}/${totalDirectives} assertions`;
		const timingSummary = `${duration}ms`;

		console.log(`${status} | ${stepsSummary} | ${directivesSummary} | ${timingSummary}`);

		// Show failed steps if any
		if (!result.success) {
			const failedSteps = result.steps.filter(s => s.error);
			if (failedSteps.length > 0) {
				console.log("\nFailed steps:");
				failedSteps.forEach(step => {
					console.log(`  - ${step.step.name}: ${step.error?.message}`);
				});
			}

			// Show failed assertions
			const failedDirectives = result.steps.flatMap(s => 
				s.directives.filter(d => !d.success).map(d => ({
					stepName: s.step.name,
					directive: d
				}))
			);
			
			if (failedDirectives.length > 0) {
				console.log("\nFailed assertions:");
				failedDirectives.forEach(({ stepName, directive }) => {
					console.log(`  - ${stepName}: ${directive.directive.type} failed`);
				});
			}
		}
	}
}