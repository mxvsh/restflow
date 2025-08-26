/**
 * Standard exit codes for CLI applications
 */
export const EXIT_CODES = {
	SUCCESS: 0,
	GENERAL_ERROR: 1,
	CONFIGURATION_ERROR: 2,
	VALIDATION_ERROR: 3,
	NETWORK_ERROR: 4,
	FILE_ERROR: 5,
} as const;

export type ExitCode = typeof EXIT_CODES[keyof typeof EXIT_CODES];

/**
 * Format error message for CLI output
 */
export function formatError(error: Error | string, context?: string): string {
	const message = error instanceof Error ? error.message : error;
	return context ? `${context}: ${message}` : message;
}

/**
 * Create a formatted error with context
 */
export function createError(message: string, context?: string): Error {
	const fullMessage = context ? `${context}: ${message}` : message;
	return new Error(fullMessage);
}

/**
 * Handle CLI exit with proper error code
 */
export function exitWithError(error: Error | string, exitCode: ExitCode = EXIT_CODES.GENERAL_ERROR): never {
	const message = error instanceof Error ? error.message : error;
	console.error(message);
	process.exit(exitCode);
}

/**
 * Safely handle promise rejection for CLI commands
 */
export function handleAsyncError(promise: Promise<void>): void {
	promise.catch((error) => {
		exitWithError(error, EXIT_CODES.GENERAL_ERROR);
	});
}