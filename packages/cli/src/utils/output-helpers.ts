import figureSet from "figures";
import pc from "picocolors";

/**
 * Format success message
 */
export function formatSuccess(message: string): string {
	return pc.green(`${figureSet.tick} ${message}`);
}

/**
 * Format error message
 */
export function formatError(message: string): string {
	return pc.red(`❌ ${message}`);
}

/**
 * Format warning message
 */
export function formatWarning(message: string): string {
	return pc.yellow(`⚠️  ${message}`);
}

/**
 * Format info message
 */
export function formatInfo(message: string): string {
	return pc.blue(`ℹ️  ${message}`);
}

/**
 * Format file path for display
 */
export function formatPath(path: string): string {
	return pc.cyan(path);
}

/**
 * Format execution summary
 */
export function formatExecutionSummary(
	totalSteps: number,
	passedSteps: number,
	totalDirectives: number,
	passedDirectives: number,
	duration: number,
): string {
	const stepSummary =
		passedSteps === totalSteps
			? pc.green(`${passedSteps}/${totalSteps} steps passed`)
			: pc.red(`${passedSteps}/${totalSteps} steps passed`);

	const directiveSummary =
		passedDirectives === totalDirectives
			? pc.green(`${passedDirectives}/${totalDirectives} directives passed`)
			: pc.red(`${passedDirectives}/${totalDirectives} directives passed`);

	const durationFormatted =
		duration > 1000
			? pc.yellow(`${(duration / 1000).toFixed(2)}s`)
			: pc.gray(`${duration}ms`);

	return `${stepSummary}, ${directiveSummary} in ${durationFormatted}`;
}
