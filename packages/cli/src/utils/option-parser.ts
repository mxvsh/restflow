import {
	validateEnvironmentPath,
	validateFlowPath,
	validateOutputFormat,
	validateTimeout,
} from "@restflow/utils";

export interface ParsedRunOptions {
	environmentFile?: string;
	format: "pretty" | "json" | "summary";
	verbose: boolean;
	showHeaders: boolean;
	showBody: boolean;
	timeout?: number;
	colors: boolean;
}

export interface RunCommandOptions {
	env?: string;
	json?: boolean;
	verbose?: boolean;
	format?: string;
	timeout?: string;
	showHeaders?: boolean;
	showBody?: boolean;
	noColor?: boolean;
}

/**
 * Parse and validate CLI options for run command
 */
export function parseRunOptions(rawOptions: RunCommandOptions): {
	options: ParsedRunOptions;
	errors: string[];
} {
	const errors: string[] = [];

	// Determine output format
	let format: "pretty" | "json" | "summary" = "pretty";
	if (rawOptions.json) {
		format = "json";
	} else if (rawOptions.format) {
		const formatValidation = validateOutputFormat(rawOptions.format);
		if (formatValidation.valid) {
			format = rawOptions.format as "pretty" | "json" | "summary";
		} else {
			errors.push(formatValidation.error || "Invalid format");
		}
	}

	// Validate environment file if provided
	let environmentFile: string | undefined;
	if (rawOptions.env) {
		const envValidation = validateEnvironmentPath(rawOptions.env);
		if (envValidation.valid) {
			environmentFile = rawOptions.env;
		} else {
			errors.push(envValidation.error || "Invalid environment path");
		}
	}

	// Validate timeout if provided
	let timeout: number | undefined;
	if (rawOptions.timeout) {
		const timeoutValidation = validateTimeout(rawOptions.timeout);
		if (timeoutValidation.valid) {
			timeout = parseInt(rawOptions.timeout, 10);
		} else {
			errors.push(timeoutValidation.error || "Invalid timeout");
		}
	}

	const options: ParsedRunOptions = {
		environmentFile,
		format,
		verbose: Boolean(rawOptions.verbose),
		showHeaders: Boolean(rawOptions.showHeaders),
		showBody: Boolean(rawOptions.showBody),
		timeout,
		colors: !rawOptions.noColor,
	};

	return { options, errors };
}

/**
 * Validate flow path argument
 */
export function validateFlowPathArgument(path: string): {
	valid: boolean;
	error?: string;
} {
	if (!path) {
		return { valid: false, error: "Flow path is required" };
	}

	return validateFlowPath(path);
}
