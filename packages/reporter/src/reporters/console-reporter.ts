import type { FlowResult, StepResult } from "@restflow/types";
import type { Reporter, ExtendedReporterOptions } from "./base-reporter.js";

/**
 * Console reporter with colored output and progress indicators
 */
export class ConsoleReporter implements Reporter {
	private options: ExtendedReporterOptions;

	constructor(options: ExtendedReporterOptions = {}) {
		this.options = {
			verbose: false,
			showHeaders: false,
			showBody: false,
			colors: true,
			showProgress: true,
			showTimings: true,
			format: "pretty",
			...options,
		};
	}

	onFlowStart(flowName: string): void {
		console.log(`🚀 Running Flow: ${flowName}`);
	}

	onStepStart(stepName: string, stepIndex: number, totalSteps: number): void {
		const progress = this.options.showProgress 
			? `[${stepIndex + 1}/${totalSteps}] ` 
			: "";
		console.log(`${progress}Step: ${stepName}`);
	}

	onStepComplete(result: StepResult): void {
		const { step, response, error, directives, duration } = result;
		
		if (error) {
			console.log(`  ❌ ${step.request.method} ${step.request.url} - Error: ${error.message}`);
			return;
		}

		if (response) {
			const timing = this.options.showTimings ? ` (${duration}ms)` : "";
			console.log(`  ✅ ${step.request.method} ${step.request.url} - ${response.status}${timing}`);
			
			// Show directives
			directives.forEach(directive => {
				const status = directive.success ? "✓" : "✗";
				console.log(`    ${status} ${directive.directive.type}: ${this.getDirectiveDescription(directive.directive)}`);
			});

			// Show headers if requested
			if (this.options.showHeaders && response.headers) {
				console.log("    Headers:");
				Object.entries(response.headers).forEach(([key, value]) => {
					console.log(`      ${key}: ${value}`);
				});
			}

			// Show body if requested
			if (this.options.showBody && response.body) {
				console.log("    Response Body:");
				const body = this.formatBody(response.body);
				console.log(`      ${body}`);
			}
		}
	}

	onFlowComplete(result: FlowResult): void {
		const passedSteps = result.steps.filter(s => !s.error).length;
		const totalDirectives = result.steps.reduce((sum, s) => sum + s.directives.length, 0);
		const passedDirectives = result.steps.reduce((sum, s) => sum + s.directives.filter(d => d.success).length, 0);
		
		console.log(`\nSummary: ${result.success ? "✅ PASSED" : "❌ FAILED"}`);
		console.log(`Steps: ${passedSteps}/${result.steps.length} passed`);
		console.log(`Directives: ${passedDirectives}/${totalDirectives} passed`);
		if (this.options.showTimings) {
			console.log(`Duration: ${result.duration}ms`);
		}
	}

	private getDirectiveDescription(directive: any): string {
		if (directive.type === "assert") {
			return directive.expression;
		} else if (directive.type === "capture") {
			return `${directive.variable} → ${directive.expression}`;
		}
		return "unknown";
	}

	private formatBody(body: string): string {
		try {
			// Try to parse and pretty-print JSON
			const parsed = JSON.parse(body);
			return JSON.stringify(parsed, null, 2).replace(/\n/g, "\n      ");
		} catch {
			// Return as-is if not JSON
			return body.length > 200 ? body.substring(0, 200) + "..." : body;
		}
	}
}