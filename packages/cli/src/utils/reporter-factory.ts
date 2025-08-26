import { createConsoleReporter, createJSONReporter, createSummaryReporter, type Reporter } from "@restflow/reporter";

export interface CLIReporterOptions {
	format?: "pretty" | "json" | "summary";
	verbose?: boolean;
	showHeaders?: boolean;
	showBody?: boolean;
	colors?: boolean;
	showProgress?: boolean;
	showTimings?: boolean;
}

/**
 * Create appropriate reporter based on CLI options
 */
export function createCLIReporter(options: CLIReporterOptions = {}): Reporter {
	const {
		format = "pretty",
		verbose = false,
		showHeaders = false,
		showBody = false,
		colors = true,
		showProgress = true,
		showTimings = true,
	} = options;

	switch (format) {
		case "json":
			return createJSONReporter({
				verbose,
				showHeaders: showHeaders || verbose,
				showBody: showBody || verbose,
			});

		case "summary":
			return createSummaryReporter({
				colors,
				showTimings,
			});

		case "pretty":
		default:
			return createConsoleReporter({
				colors,
				verbose,
				showProgress,
				showTimings,
				showHeaders: showHeaders || verbose,
				showBody: showBody || verbose,
			});
	}
}