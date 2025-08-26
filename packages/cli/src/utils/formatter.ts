import figures from "figures";
import pc from "picocolors";
import stripAnsi from "strip-ansi";
import type { FlowResult, StepResult, Directive, DirectiveResult } from "@restflow/types";

/**
 * CLI formatter with beautiful icons, colors, and tables
 */
export class Formatter {
	private colors: boolean;

	constructor(colors = true) {
		this.colors = colors;
	}

	/**
	 * Get appropriate icons based on terminal capabilities
	 */
	private getIcons() {
		return {
			// Status icons
			success: figures.tick,
			error: figures.cross,
			warning: figures.warning,
			info: figures.info,

			// Flow icons
			flow: figures.arrowRight,
			step: figures.bullet,

			// HTTP method icons
			get: figures.arrowDown,
			post: figures.arrowUp,
			put: figures.arrowRight,
			patch: figures.triangleRight,
			delete: figures.cross,

			// Progress indicators
			running: figures.ellipsis,
			completed: figures.tick,

			// Misc
			time: "◦",
			folder: "▸",
			file: "▸",
		};
	}

	/**
	 * Create a beautiful header box
	 */
	createHeader(title: string): string {
		const coloredTitle = this.colors ? pc.bold(pc.cyan(title)) : title;

		return `\n${coloredTitle}\n${"─".repeat(title.length)}\n`;
	}

	/**
	 * Format flow start message
	 */
	formatFlowStart(flowName: string): string {
		const icons = this.getIcons();
		const flowIcon = this.colors ? pc.cyan(icons.flow) : icons.flow;
		const name = this.colors ? pc.bold(pc.white(flowName)) : flowName;

		return `${flowIcon} ${name}`;
	}

	/**
	 * Format step progress
	 */
	formatStepProgress(
		stepName: string,
		stepIndex: number,
		totalSteps: number,
	): string {
		const icons = this.getIcons();
		const stepIcon = this.colors ? pc.blue(icons.step) : icons.step;
		const progress = this.colors
			? pc.dim(`[${pc.cyan(stepIndex + 1)}/${pc.cyan(totalSteps)}]`)
			: `[${stepIndex + 1}/${totalSteps}]`;
		const name = this.colors ? pc.white(stepName) : stepName;

		return `  ${stepIcon} ${progress} ${name}`;
	}

	/**
	 * Format HTTP request result
	 */
	formatHttpResult(result: StepResult): string {
		const icons = this.getIcons();
		const { step, response, error, duration } = result;

		if (error) {
			const errorIcon = this.colors ? pc.red(icons.error) : icons.error;
			const method = this.colors
				? pc.bold(step.request.method)
				: step.request.method;
			const url = this.colors ? pc.dim(step.request.url) : step.request.url;
			const errorMsg = this.colors ? pc.red(error.message) : error.message;
			return `    ${errorIcon} ${method} ${url} - ${errorMsg}`;
		}

		if (response) {
			const successIcon = this.colors ? pc.green(icons.success) : icons.success;
			const method = this.getMethodIcon(step.request.method);
			const url = this.colors ? pc.dim(step.request.url) : step.request.url;
			const status = this.formatStatusCode(response.status);
			const timing = this.colors
				? pc.dim(`${icons.time} ${duration}ms`)
				: `${icons.time} ${duration}ms`;

			return `    ${successIcon} ${method} ${url} - ${status} ${timing}`;
		}

		return "";
	}

	/**
	 * Get method-specific icon and color
	 */
	private getMethodIcon(method: string): string {
		const icons = this.getIcons();
		const methodUpper = method.toUpperCase();

		if (!this.colors) {
			return methodUpper;
		}

		switch (methodUpper) {
			case "GET":
				return pc.green(`${icons.get} ${methodUpper}`);
			case "POST":
				return pc.blue(`${icons.post} ${methodUpper}`);
			case "PUT":
				return pc.yellow(`${icons.put} ${methodUpper}`);
			case "PATCH":
				return pc.cyan(`${icons.patch} ${methodUpper}`);
			case "DELETE":
				return pc.red(`${icons.delete} ${methodUpper}`);
			default:
				return pc.white(`${figures.bullet} ${methodUpper}`);
		}
	}

	/**
	 * Format HTTP status code with appropriate color
	 */
	private formatStatusCode(status: number): string {
		if (!this.colors) {
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
	 * Format directive results
	 */

	formatDirectives(directives: DirectiveResult[]): string[] {
		const icons = this.getIcons();

		return directives.map((directive) => {
			const status = directive.success ? icons.success : icons.error;
			const statusColored = this.colors
				? directive.success
					? pc.green(status)
					: pc.red(status)
				: status;

			const type = this.colors
				? pc.cyan(directive.directive.type)
				: directive.directive.type;
			const description = this.getDirectiveDescription(directive.directive);

			return `      ${statusColored} ${type}: ${description}`;
		});
	}

	/**
	 * Create a clean summary
	 */
	createSummaryTable(result: FlowResult): string {
		const passedSteps = result.steps.filter((s) => !s.error).length;
		const totalDirectives = result.steps.reduce(
			(sum, s) => sum + s.directives.length,
			0,
		);
		const passedDirectives = result.steps.reduce(
			(sum, s) => sum + s.directives.filter((d) => d.success).length,
			0,
		);

		const icons = this.getIcons();

		// Overall status
		const overallStatus = result.success
			? this.colors
				? pc.green(`${icons.success} PASSED`)
				: `${icons.success} PASSED`
			: this.colors
				? pc.red(`${icons.error} FAILED`)
				: `${icons.error} FAILED`;

		// Steps status
		const stepsStatus = this.colors
			? `${pc.green(passedSteps)}/${pc.white(result.steps.length)} passed`
			: `${passedSteps}/${result.steps.length} passed`;

		// Directives status
		const directivesStatus = this.colors
			? `${pc.green(passedDirectives)}/${pc.white(totalDirectives)} passed`
			: `${passedDirectives}/${totalDirectives} passed`;

		// Duration
		const duration = this.colors
			? `${pc.cyan(result.duration)}ms`
			: `${result.duration}ms`;

		const summary = this.colors ? pc.bold("Summary:") : "Summary:";

		return [
			summary,
			`  Status:     ${overallStatus}`,
			`  Steps:      ${stepsStatus}`,
			`  Directives: ${directivesStatus}`,
			`  Duration:   ${duration}`,
		].join("\n");
	}

	/**
	 * Create a clean overall summary for multiple flows
	 */
	createOverallSummaryTable(
		totalSteps: number,
		passedSteps: number,
		totalDirectives: number,
		passedDirectives: number,
		totalDuration: number,
	): string {
		const stepsStatus = this.colors
			? `${pc.green(passedSteps)}/${pc.white(totalSteps)} passed`
			: `${passedSteps}/${totalSteps} passed`;

		const directivesStatus = this.colors
			? `${pc.green(passedDirectives)}/${pc.white(totalDirectives)} passed`
			: `${passedDirectives}/${totalDirectives} passed`;

		const duration = this.colors
			? `${pc.cyan(totalDuration)}ms`
			: `${totalDuration}ms`;

		const summary = this.colors
			? pc.bold("Overall Summary:")
			: "Overall Summary:";

		return [
			summary,
			`  Steps:      ${stepsStatus}`,
			`  Directives: ${directivesStatus}`,
			`  Duration:   ${duration}`,
		].join("\n");
	}

	/**
	 * Format file path with icon
	 */
	formatPath(path: string): string {
		const icons = this.getIcons();
		const icon = path.includes(".") ? icons.file : icons.folder;
		const iconColored = this.colors ? pc.dim(icon) : icon;
		const pathColored = this.colors ? pc.cyan(path) : path;

		return `${iconColored} ${pathColored}`;
	}

	/**
	 * Create info message
	 */
	formatInfo(message: string): string {
		const icons = this.getIcons();
		const icon = this.colors ? pc.blue(icons.info) : icons.info;
		const msg = this.colors ? pc.white(message) : message;

		return `${icon} ${msg}`;
	}

	/**
	 * Create warning message
	 */
	formatWarning(message: string): string {
		const icons = this.getIcons();
		const icon = this.colors ? pc.yellow(icons.warning) : icons.warning;
		const msg = this.colors ? pc.yellow(message) : message;

		return `${icon} ${msg}`;
	}

	/**
	 * Create error message
	 */
	formatError(message: string): string {
		const icons = this.getIcons();
		const icon = this.colors ? pc.red(icons.error) : icons.error;
		const msg = this.colors ? pc.red(message) : message;

		return `${icon} ${msg}`;
	}

	/**
	 * Get directive description
	 */
	private getDirectiveDescription(directive: Directive): string {
		if (directive.type === "assert") {
			return this.colors ? pc.dim(directive.expression) : directive.expression;
		} else if (directive.type === "capture") {
			const variable = this.colors
				? pc.green(directive.variable)
				: directive.variable;
			const expression = this.colors
				? pc.dim(directive.expression)
				: directive.expression;
			return `${variable} ← ${expression}`;
		}
		return "unknown";
	}

	/**
	 * Get text width without ANSI codes for proper alignment
	 */
	getTextWidth(text: string): number {
		return stripAnsi(text).length;
	}
}
