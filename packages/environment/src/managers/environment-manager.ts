import type { Environment, ExecutionContext } from "@restflow/types";
import { DefaultVariableResolver } from "@restflow/variables";
import {
	DotenvLoader,
	EnvLoadError,
	type EnvLoader,
} from "../loaders/env-loader.js";
import { DefaultEnvMerger, type EnvMerger } from "../mergers/env-merger.js";
import {
	EnvValidator,
	type ValidationResult,
	type ValidationRule,
} from "../validators/env-validator.js";

export interface EnvironmentManagerOptions {
	loader?: EnvLoader;
	merger?: EnvMerger;
	validator?: EnvValidator;
	includeProcessEnv?: boolean;
}

export class EnvironmentManager {
	private loader: EnvLoader;
	private merger: EnvMerger;
	private validator: EnvValidator;
	private includeProcessEnv: boolean;

	constructor(options: EnvironmentManagerOptions = {}) {
		this.loader = options.loader || new DotenvLoader();
		this.merger = options.merger || new DefaultEnvMerger();
		this.validator = options.validator || new EnvValidator();
		this.includeProcessEnv = options.includeProcessEnv ?? false;
	}

	async loadEnvironment(filePath?: string): Promise<Environment> {
		let fileVariables: Record<string, string> = {};

		if (filePath) {
			try {
				fileVariables = this.loader.load(filePath);
			} catch (error) {
				if (error instanceof EnvLoadError) {
					throw error;
				}
				throw new EnvLoadError(
					`Failed to load environment from ${filePath}: ${error}`,
				);
			}
		}

		const processVariables = this.includeProcessEnv
			? this.getProcessEnvVariables()
			: {};

		const mergedVariables = this.merger.merge(processVariables, fileVariables);

		// Resolve built-in variables and variable references in environment values
		const resolvedVariables = this.resolveEnvironmentVariables(mergedVariables);

		return {
			name: filePath ? this.extractEnvironmentName(filePath) : "default",
			variables: resolvedVariables,
		};
	}

	validateEnvironment(
		environment: Environment,
		rules: ValidationRule[],
	): ValidationResult {
		return this.validator.validate(environment.variables, rules);
	}

	mergeEnvironments(...environments: Environment[]): Environment {
		const allVariables = environments.map((env) => env.variables);
		const mergedVariables = this.merger.merge(...allVariables);

		return {
			name: "merged",
			variables: mergedVariables,
		};
	}

	private getProcessEnvVariables(): Record<string, string> {
		const result: Record<string, string> = {};

		for (const [key, value] of Object.entries(process.env)) {
			if (value !== undefined) {
				result[key] = value;
			}
		}

		return result;
	}

	private extractEnvironmentName(filePath: string): string {
		const fileName = filePath.split("/").pop() || filePath;
		return fileName.replace(/\.(env|environment)$/, "");
	}

	private resolveEnvironmentVariables(
		variables: Record<string, string>,
	): Record<string, string> {
		const resolver = new DefaultVariableResolver();
		const maxIterations = 10; // Prevent infinite loops

		// Keep resolving until no more changes or max iterations reached
		let currentVariables = { ...variables };
		let hasChanges = true;
		let iteration = 0;

		while (hasChanges && iteration < maxIterations) {
			hasChanges = false;
			const newResolved: Record<string, string> = {};

			for (const [key, value] of Object.entries(currentVariables)) {
				try {
					// Create a context with current variables for resolution
					const context: ExecutionContext = {
						variables: currentVariables,
						responses: [],
					};

					const resolvedValue = resolver.resolve(value, context);
					newResolved[key] = resolvedValue;

					// Check if this value changed
					if (resolvedValue !== value) {
						hasChanges = true;
					}
				} catch (_error) {
					// If resolution fails, keep the original value
					newResolved[key] = value;
				}
			}

			currentVariables = newResolved;
			iteration++;
		}

		return currentVariables;
	}
}

// Convenience function for simple environment loading
export async function loadEnvironmentFile(
	filePath: string,
): Promise<Environment> {
	const manager = new EnvironmentManager();
	return manager.loadEnvironment(filePath);
}
