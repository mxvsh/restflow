import type { Directive, FlowResult, StepResult } from "@restflow/types";
import figures from "figures";
import pc from "picocolors";
import type { ExtendedReporterOptions, Reporter } from "./base-reporter.js";

/**
 * Enhanced console reporter with beautiful formatting, icons, colors, and tables
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
		const icon = this.options.colors
			? pc.cyan(figures.arrowRight)
			: figures.arrowRight;
		const name = this.options.colors ? pc.bold(pc.white(flowName)) : flowName;
		console.log(`${icon} ${name}`);
	}

	onStepStart(stepName: string, stepIndex: number, totalSteps: number): void {
		if (this.options.showProgress) {
			const stepIcon = this.options.colors
				? pc.blue(figures.bullet)
				: figures.bullet;
			const progress = this.options.colors
				? pc.dim(`[${pc.cyan(stepIndex + 1)}/${pc.cyan(totalSteps)}]`)
				: `[${stepIndex + 1}/${totalSteps}]`;
			const name = this.options.colors ? pc.white(stepName) : stepName;

			console.log(`  ${stepIcon} ${progress} ${name}`);
		}
	}

	onStepComplete(result: StepResult): void {
		const { request, response, error, directives, duration } = result;

		if (error) {
			const errorIcon = this.options.colors
				? pc.red(figures.cross)
				: figures.cross;
			const method = this.options.colors
				? pc.bold(request.method)
				: request.method;
			const url = this.options.colors ? pc.dim(request.url) : request.url;
			const errorMsg = this.options.colors
				? pc.red(error.message)
				: error.message;
			console.log(`    ${errorIcon} ${method} ${url} - ${errorMsg}`);
			return;
		}

		if (response) {
			const successIcon = this.options.colors
				? pc.green(figures.tick)
				: figures.tick;
			const method = this.getMethodIcon(request.method);
			const url = this.options.colors ? pc.dim(request.url) : request.url;
			const status = this.formatStatusCode(response.status);
			const timing = this.options.showTimings
				? this.options.colors
					? pc.dim(`◦ ${duration}ms`)
					: `◦ ${duration}ms`
				: "";

			console.log(`    ${successIcon} ${method} ${url} - ${status} ${timing}`);

			// Show directives
			directives.forEach((directive) => {
				const statusIcon = directive.success ? figures.tick : figures.cross;
				const statusColored = this.options.colors
					? directive.success
						? pc.green(statusIcon)
						: pc.red(statusIcon)
					: statusIcon;

				const type = this.options.colors
					? pc.cyan(directive.directive.type)
					: directive.directive.type;
				const description = this.getDirectiveDescription(directive.directive);

				console.log(`      ${statusColored} ${type}: ${description}`);

				// Show console output if it's a console directive
				if (directive.directive.type === "console" && directive.consoleOutput) {
					const consoleLines = directive.consoleOutput.split('\n');
					consoleLines.forEach(line => {
						console.log(`        ${line}`);
					});
				}
			});

			// Show headers if requested
			if (this.options.showHeaders && response.headers) {
				this.showHeaders(response.headers);
			}

			// Show body if requested
			if (this.options.showBody && response.body) {
				this.showResponseBody(response.body);
			}
		}
	}

	onFlowComplete(result: FlowResult): void {
		console.log(); // Add spacing
		console.log(this.createSummaryTable(result));
	}

	/**
	 * Get method-specific icon and color
	 */
	private getMethodIcon(method: string): string {
		const methodUpper = method.toUpperCase();

		if (!this.options.colors) {
			return methodUpper;
		}

		switch (methodUpper) {
			case "GET":
				return pc.green(`${figures.arrowDown} ${methodUpper}`);
			case "POST":
				return pc.blue(`${figures.arrowUp} ${methodUpper}`);
			case "PUT":
				return pc.yellow(`${figures.arrowRight} ${methodUpper}`);
			case "PATCH":
				return pc.cyan(`${figures.triangleRight} ${methodUpper}`);
			case "DELETE":
				return pc.red(`${figures.cross} ${methodUpper}`);
			default:
				return pc.white(`${figures.bullet} ${methodUpper}`);
		}
	}

	/**
	 * Format HTTP status code with appropriate color
	 */
	private formatStatusCode(status: number): string {
		if (!this.options.colors) {
			return status.toString();
		}

		if (status >= 200 && status < 300) {
			return pc.green(status.toString());
		} else if (status >= 300 && status < 400) {
			return pc.yellow(status.toString());
		} else if (status >= 400 && status < 500) {
			return pc.red(status.toString());
		} else if (status >= 500) {
			return pc.magenta(status.toString());
		}

		return pc.white(status.toString());
	}

	/**
	 * Create a clean, minimal summary
	 */
	private createSummaryTable(result: FlowResult): string {
		const passedSteps = result.steps.filter((s) => !s.error).length;
		const totalDirectives = result.steps.reduce(
			(sum, s) => sum + s.directives.length,
			0,
		);
		const passedDirectives = result.steps.reduce(
			(sum, s) => sum + s.directives.filter((d) => d.success).length,
			0,
		);

		// Overall status
		const overallStatus = result.success
			? this.options.colors
				? pc.green(`${figures.tick} PASSED`)
				: `${figures.tick} PASSED`
			: this.options.colors
				? pc.red(`${figures.cross} FAILED`)
				: `${figures.cross} FAILED`;

		// Steps status
		const stepsStatus = this.options.colors
			? `${pc.green(passedSteps)}/${pc.white(result.steps.length)} passed`
			: `${passedSteps}/${result.steps.length} passed`;

		// Directives status
		const directivesStatus = this.options.colors
			? `${pc.green(passedDirectives)}/${pc.white(totalDirectives)} passed`
			: `${passedDirectives}/${totalDirectives} passed`;

		// Duration
		const duration = this.options.colors
			? `${pc.cyan(result.duration)}ms`
			: `${result.duration}ms`;

		// Create clean summary without table borders
		const summary = this.options.colors ? pc.bold("Summary:") : "Summary:";

		return [
			summary,
			`  Status:     ${overallStatus}`,
			`  Steps:      ${stepsStatus}`,
			`  Directives: ${directivesStatus}`,
			`  Duration:   ${duration}`,
		].join("\n");
	}

	/**
	 * Show HTTP headers in a clean format
	 */
	private showHeaders(headers: Record<string, string>): void {
		console.log("      Headers:");

		Object.entries(headers).forEach(([key, value]) => {
			const headerName = this.options.colors ? pc.green(key) : key;
			const headerValue = this.options.colors ? pc.white(value) : value;
			console.log(`        ${headerName}: ${headerValue}`);
		});
	}

	/**
	 * Show response body with syntax highlighting for JSON
	 */
	private showResponseBody(body: string): void {
		console.log("      Response Body:");

		try {
			// Try to parse and pretty-print JSON
			const parsed = JSON.parse(body);
			const formatted = JSON.stringify(parsed, null, 2);

			if (this.options.colors) {
				// Basic JSON syntax highlighting
				const highlighted = formatted
					.replace(/"([^"]+)":/g, `${pc.cyan('"$1"')}:`) // Keys
					.replace(/: "([^"]+)"/g, `: ${pc.green('"$1"')}`) // String values
					.replace(/: (\d+)/g, `: ${pc.yellow("$1")}`) // Numbers
					.replace(/: (true|false)/g, `: ${pc.magenta("$1")}`) // Booleans
					.replace(/: null/g, `: ${pc.red("null")}`); // Null

				console.log(
					highlighted
						.split("\n")
						.map((line) => `        ${line}`)
						.join("\n"),
				);
			} else {
				console.log(
					formatted
						.split("\n")
						.map((line) => `        ${line}`)
						.join("\n"),
				);
			}
		} catch {
			// Return as-is if not JSON, with truncation for very long bodies
			const displayBody =
				body.length > 500 ? `${body.substring(0, 500)}...` : body;

			console.log(
				displayBody
					.split("\n")
					.map((line) => `        ${line}`)
					.join("\n"),
			);
		}
	}

	private getDirectiveDescription(directive: Directive): string {
		if (directive.type === "assert") {
			return this.options.colors
				? pc.dim(directive.expression)
				: directive.expression;
		} else if (directive.type === "capture") {
			const variable = this.options.colors
				? pc.green(directive.variable)
				: directive.variable;
			const expression = this.options.colors
				? pc.dim(directive.expression)
				: directive.expression;
			return `${variable} ← ${expression}`;
		} else if (directive.type === "console") {
			const expression = this.options.colors
				? pc.dim(directive.expression)
				: directive.expression;
			return `${expression}`;
		}
		return "unknown";
	}
}
