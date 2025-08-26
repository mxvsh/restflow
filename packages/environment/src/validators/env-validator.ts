export interface ValidationRule {
	key: string;
	required?: boolean;
	type?: "string" | "number" | "boolean";
	pattern?: RegExp;
	allowedValues?: string[];
	description?: string;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
}

export interface ValidationError {
	key: string;
	message: string;
	rule: ValidationRule;
}

export interface ValidationWarning {
	key: string;
	message: string;
	rule: ValidationRule;
}

export class EnvValidator {
	validate(
		env: Record<string, string>,
		rules: ValidationRule[],
	): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		for (const rule of rules) {
			const value = env[rule.key];

			// Check required fields
			if (rule.required && (value === undefined || value === "")) {
				errors.push({
					key: rule.key,
					message: `Required environment variable '${rule.key}' is missing`,
					rule,
				});
				continue;
			}

			// Skip validation if value is not present and not required
			if (value === undefined || value === "") {
				continue;
			}

			// Type validation
			if (rule.type && !this.validateType(value, rule.type)) {
				errors.push({
					key: rule.key,
					message: `Environment variable '${rule.key}' must be of type ${rule.type}`,
					rule,
				});
			}

			// Pattern validation
			if (rule.pattern && !rule.pattern.test(value)) {
				errors.push({
					key: rule.key,
					message: `Environment variable '${rule.key}' does not match required pattern`,
					rule,
				});
			}

			// Allowed values validation
			if (rule.allowedValues && !rule.allowedValues.includes(value)) {
				errors.push({
					key: rule.key,
					message: `Environment variable '${rule.key}' must be one of: ${rule.allowedValues.join(", ")}`,
					rule,
				});
			}
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}

	private validateType(value: string, type: string): boolean {
		switch (type) {
			case "string":
				return true; // All env vars are strings
			case "number":
				return !isNaN(Number(value));
			case "boolean":
				return ["true", "false", "1", "0", "yes", "no"].includes(
					value.toLowerCase(),
				);
			default:
				return true;
		}
	}
}

// Common validation rules for typical environment variables
export const commonRules: ValidationRule[] = [
	{
		key: "NODE_ENV",
		allowedValues: ["development", "production", "test", "staging"],
		description: "Application environment",
	},
	{
		key: "PORT",
		type: "number",
		description: "Server port number",
	},
	{
		key: "API_URL",
		pattern: /^https?:\/\/.+/,
		description: "API base URL",
	},
];
