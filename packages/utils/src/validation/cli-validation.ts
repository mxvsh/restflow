import { sync } from "../file/file-operations.js";
import { isFlowFile } from "../file/flow-utils.js";

/**
 * Validation result interface
 */
export interface ValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Validate flow file path
 */
export function validateFlowPath(path: string): ValidationResult {
	if (!path) {
		return { valid: false, error: "Path is required" };
	}

	if (sync.fileExists(path)) {
		if (!isFlowFile(path)) {
			return { valid: false, error: `File must have .flow extension: ${path}` };
		}
		return { valid: true };
	}

	if (sync.directoryExists(path)) {
		return { valid: true };
	}

	return { valid: false, error: `Path not found: ${path}` };
}

/**
 * Validate environment file path
 */
export function validateEnvironmentPath(path: string): ValidationResult {
	if (!path) {
		return { valid: false, error: "Environment path is required" };
	}

	if (!sync.fileExists(path)) {
		return { valid: false, error: `Environment file not found: ${path}` };
	}

	return { valid: true };
}

/**
 * Validate timeout value
 */
export function validateTimeout(timeout: string | number): ValidationResult {
	const timeoutNum =
		typeof timeout === "string" ? parseInt(timeout, 10) : timeout;

	if (Number.isNaN(timeoutNum)) {
		return { valid: false, error: "Timeout must be a number" };
	}

	if (timeoutNum < 0) {
		return { valid: false, error: "Timeout cannot be negative" };
	}

	if (timeoutNum > 300000) {
		// 5 minutes max
		return {
			valid: false,
			error: "Timeout cannot exceed 300000ms (5 minutes)",
		};
	}

	return { valid: true };
}

/**
 * Validate output format
 */
export function validateOutputFormat(format: string): ValidationResult {
	const validFormats = ["pretty", "json", "summary"];

	if (!validFormats.includes(format)) {
		return {
			valid: false,
			error: `Invalid format. Must be one of: ${validFormats.join(", ")}`,
		};
	}

	return { valid: true };
}
