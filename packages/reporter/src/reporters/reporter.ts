// Export all reporter implementations
export type { ExtendedReporterOptions, Reporter } from "./base-reporter.js";
export { ConsoleReporter } from "./console-reporter.js";
export { JSONReporter } from "./json-reporter.js";
export { SummaryReporter } from "./summary-reporter.js";

import type { ExtendedReporterOptions } from "./base-reporter.js";
// Factory functions for creating reporters
import { ConsoleReporter } from "./console-reporter.js";
import { JSONReporter } from "./json-reporter.js";
import { SummaryReporter } from "./summary-reporter.js";

export function createConsoleReporter(options: ExtendedReporterOptions = {}) {
	return new ConsoleReporter(options);
}

export function createJSONReporter(options: ExtendedReporterOptions = {}) {
	return new JSONReporter(options);
}

export function createSummaryReporter(options: ExtendedReporterOptions = {}) {
	return new SummaryReporter(options);
}
